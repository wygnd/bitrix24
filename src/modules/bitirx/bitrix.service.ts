import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { REDIS_CLIENT, REDIS_KEYS } from '../redis/redis.constants';
import { AppHttpService } from '../http/http.service';
import {
  BitrixOauthResponse,
  BitrixTokens,
} from './interfaces/bitrix-auth.interface';
import { BitrixConfig } from '../../common/interfaces/bitrix-config.interface';
import { B24Response } from './interfaces/bitrix-api.interface';

@Injectable()
export class BitrixService {
  private tokens: BitrixTokens;
  private readonly bitrixOauthUrl: string =
    'https://oauth.bitrix24.tech/oauth/token/';
  private readonly bitrixDomain: string;
  private readonly bitrixClientId: string;
  private readonly bitrixClientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => AppHttpService))
    private readonly http: AppHttpService,
  ) {
    const bitrixConfig = configService.get<BitrixConfig>('bitrixConfig');

    if (!bitrixConfig) throw new Error('Invalid bitrix config');

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
  }

  async callMethod<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(method: string, params: Partial<T> = {}) {
    const { access_token } = await this.getTokens();
    return await this.http.post<Partial<T> & { auth?: string }, B24Response<U>>(
      `/rest/${method}`,
      {
        ...params,
        auth: access_token,
      },
    );
  }

  // todo: call batch

  private async getTokens(): Promise<BitrixTokens> {
    if (!this.tokens.refresh_token || !this.tokens.access_token) {
      const accessToken =
        (await this.redisService.get<string>(REDIS_KEYS.BITRIX_ACCESS_TOKEN)) ??
        '';
      const expiresAccessToken =
        (await this.redisService.get<number>(
          REDIS_KEYS.BITRIX_ACCESS_EXPIRES,
        )) ?? 0;
      const refreshToken = await this.redisService.get<string>(
        REDIS_KEYS.BITRIX_REFRESH_TOKEN,
      );

      if (!refreshToken) throw new Error('Failed to refresh token');

      if (Date.now() < expiresAccessToken * 1000) {
        const tokens = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires: expiresAccessToken ?? 0,
        };

        this.tokens = { ...tokens };
        return tokens;
      }

      return await this.updateAccessToken(refreshToken);
    }

    if (this.tokens.access_token && Date.now() < this.tokens.expires * 1000)
      return this.tokens;

    return await this.updateAccessToken(this.tokens.access_token);
  }

  /**
   * Call auth url bitrix to get new access token
   * @param refreshToken string
   * @private
   */
  private async updateAccessToken(refreshToken: string): Promise<BitrixTokens> {
    const { access_token, refresh_token, expires } = await this.http.post<
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
}
