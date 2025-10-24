import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { REDIS_CLIENT, REDIS_KEYS } from '../redis/redis.constants';
import {
  BitrixOauthResponse,
  BitrixTokens,
} from './interfaces/bitrix-auth.interface';
import {
  BitrixConfig,
  BitrixConstants,
} from '@/common/interfaces/bitrix-config.interface';
import {
  B24BatchResponseMap,
  B24SuccessResponse,
} from './interfaces/bitrix-api.interface';
import {
  B24AvailableMethods,
  B24BatchCommands,
} from './interfaces/bitrix.interface';
import qs from 'qs';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class BitrixService {
  private tokens: BitrixTokens;
  private readonly bitrixOauthUrl: string =
    'https://oauth.bitrix24.tech/oauth/token/';
  private readonly bitrixDomain: string;
  private readonly bitrixClientId: string;
  private readonly bitrixClientSecret: string;
  private readonly botId: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    @Inject('BitrixApiService')
    private readonly http: AxiosInstance,
  ) {
    const bitrixConfig = configService.get<BitrixConfig>('bitrixConfig');
    const bitrixConstants =
      configService.get<BitrixConstants>('bitrixConstants');

    if (!bitrixConfig) throw new Error('Invalid bitrix config');
    if (!bitrixConstants) throw new Error('Invalid bitrix constants');

    this.bitrixDomain = bitrixConfig.bitrixDomain;
    this.bitrixClientId = bitrixConfig.bitrixClientId;
    this.bitrixClientSecret = bitrixConfig.bitrixClientSecret;

    if (!this.bitrixClientId) throw new Error('Invalid bitrix client id');
    if (!this.bitrixClientSecret)
      throw new Error('Invalid bitrix client secret');

    this.tokens = {
      access_token: '',
      refresh_token: '',
      expires: 0,
    };

    this.http.defaults.baseURL = bitrixConfig.bitrixDomain;
    this.http.defaults.headers['Content-Type'] = 'application/json';

    //   Constants
    const { BOT_ID } = bitrixConstants;
    this.botId = BOT_ID;
  }

  async callMethod<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(method: B24AvailableMethods, params: Partial<T> = {}) {
    const { access_token } = await this.getTokens();
    return this.post<Partial<T>, B24SuccessResponse<U>>(`/rest/${method}`, {
      ...params,
      auth: access_token,
    });
  }

  async callBatch<T>(commands: B24BatchCommands, halt = false) {
    const { access_token } = await this.getTokens();

    const cmd = Object.entries(commands).reduce(
      (acc, [key, { method, params }]) => {
        acc[key] = `${method}?${qs.stringify(params)}`;
        return acc;
      },
      {} as Record<string, string>,
    );

    const response = (await this.post('/rest/batch.json', {
      cmd: cmd,
      halt: halt,
      auth: access_token,
    })) as B24BatchResponseMap;

    const errors = Object.entries(response.result.result_error).reduce(
      (acc, [command, errorData]) => {
        acc += `${command}: ${errorData.error}\n`;
        return acc;
      },
      '' as string,
    );

    if (errors && halt) throw new Error(errors);

    return response as T;
  }

  public isAvailableToDistributeOnManager() {
    const now = new Date();

    if (
      (now.getDay() > 0 && now.getDay() < 6 && now.getHours() < 17) ||
      (now.getHours() > 17 && now.getMinutes() < 30)
    )
      return true;

    return false;
  }

  public async getTokens(): Promise<BitrixTokens> {
    if (
      this.tokens &&
      this.tokens?.access_token &&
      Date.now() < this.tokens?.expires * 1000
    )
      return this.tokens;

    const [accessToken, expiresAccessToken, refreshToken] = await Promise.all([
      this.redisService.get<string>(REDIS_KEYS.BITRIX_ACCESS_TOKEN),
      this.redisService.get<number>(REDIS_KEYS.BITRIX_ACCESS_EXPIRES),
      this.redisService.get<string>(REDIS_KEYS.BITRIX_REFRESH_TOKEN),
    ]);

    if (!refreshToken) throw new UnauthorizedException('Invalid refresh token');

    if (!accessToken) return this.updateAccessToken(refreshToken);

    if (expiresAccessToken && Date.now() < expiresAccessToken * 1000) {
      this.tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires: expiresAccessToken ? +expiresAccessToken : 0,
      };

      return this.tokens;
    }

    return this.updateAccessToken(refreshToken);
  }

  /**
   * Call auth url bitrix to get new access token
   * @param refreshToken string
   * @private
   */
  private async updateAccessToken(refreshToken: string): Promise<BitrixTokens> {
    const { access_token, refresh_token, expires } = await this.post<
      object,
      BitrixOauthResponse
    >(
      '',
      {},
      {
        params: {
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          client_id: this.bitrixClientId,
          client_secret: this.bitrixClientSecret,
        },
        baseURL: this.bitrixOauthUrl,
      },
    );

    this.tokens = {
      access_token: access_token,
      expires: expires,
      refresh_token: refresh_token,
    };

    try {
      await this.redisService.set<string>(
        REDIS_KEYS.BITRIX_ACCESS_TOKEN,
        access_token,
      );
      await this.redisService.set<number>(
        REDIS_KEYS.BITRIX_ACCESS_EXPIRES,
        expires,
      );
      await this.redisService.set<string>(
        REDIS_KEYS.BITRIX_REFRESH_TOKEN,
        refresh_token,
      );
    } catch (error) {
      console.log(
        `Exception error on update access token and save in redis: `,
        error,
      );

      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return this.tokens;
  }

  /**
   * Return string url lead
   * @param leadId
   * @param label
   * @return string
   */
  public generateLeadUrl(leadId: number | string, label?: string) {
    const url = `${this.bitrixDomain}/crm/lead/details/${leadId}/`;

    if (label) return `[url=${url}]${label}[/url]`;

    return url;
  }

  /**
   * Return string url deal
   * @param dealId
   * @param label
   * @return string
   */
  public generateDealUrl(dealId: number | string, label?: string) {
    const url = `${this.bitrixDomain}/crm/deal/details/${dealId}/`;

    if (label) return `[url=${url}]${label}[/url]`;

    return url;
  }

  public async updateTokens() {
    const [accessToken, expiresAccessToken, refreshToken] = await Promise.all([
      this.redisService.get<string>(REDIS_KEYS.BITRIX_ACCESS_TOKEN),
      this.redisService.get<number>(REDIS_KEYS.BITRIX_ACCESS_EXPIRES),
      this.redisService.get<string>(REDIS_KEYS.BITRIX_REFRESH_TOKEN),
    ]);

    if (!accessToken || !expiresAccessToken || !refreshToken)
      throw new UnauthorizedException('Invalid update tokens');

    this.tokens = {
      access_token: accessToken,
      expires: expiresAccessToken,
      refresh_token: refreshToken,
    };

    return this.tokens;
  }

  private async post<T, U = any>(
    url: string,
    body: T,
    config?: AxiosRequestConfig<T>,
  ) {
    const { data } = await this.http.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return data;
  }

  get BOT_ID() {
    return this.botId;
  }

  get BITRIX_DOMAIN() {
    return this.bitrixDomain;
  }
}
