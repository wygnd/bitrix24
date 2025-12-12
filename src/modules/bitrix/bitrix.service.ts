import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
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
import emojiStrip from 'emoji-strip';
import { TokensService } from '@/modules/tokens/tokens.service';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { B24UserCurrent } from '@/modules/bitrix/modules/user/interfaces/user-current.interface';

@Injectable()
export class BitrixService {
  private tokens: BitrixTokens;
  private readonly bitrixOauthUrl: string =
    'https://oauth.bitrix24.tech/oauth/token/';
  private readonly bitrixDomain: string;
  private readonly bitrixClientId: string;
  private readonly bitrixClientSecret: string;
  private readonly bitrixConstants: BitrixConstants;
  private readonly logger = new WinstonLogger(
    BitrixService.name,
    'bitrix:service'.split(':'),
  );

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    @Inject('BitrixApiService')
    private readonly http: AxiosInstance,
    private readonly tokensService: TokensService,
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

    this.http.defaults.baseURL = this.bitrixDomain;
    this.http.defaults.headers['Content-Type'] = 'application/json';
    this.http.defaults.headers.common['Accept'] = 'application/json';

    //   Constants
    this.bitrixConstants = bitrixConstants;
  }

  /**
   * Send request to bitrix
   * See https://apidocs.bitrix24.ru/ for target method
   * @param method - bitrix method
   * @param params - params for method.
   */
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

  /**
   * Send batch request to bitrix
   * @param commands - object of list commands where key is unique id command and value is command object
   * @param halt
   */
  async callBatch<T>(commands: B24BatchCommands, halt = false) {
    const { access_token } = await this.getTokens();

    const cmd = Object.entries(commands).reduce(
      (acc, [key, { method, params }]) => {
        acc[key] = `${method}?${qs.stringify(params)}`;
        return acc;
      },
      {} as Record<string, string>,
    );

    const response = (await this.post('/rest/batch', {
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

  // todo: callBatchV2 which form batches packages from items
  async callBatches<T extends object>(
    commands: B24BatchCommands,
    halt = false,
  ) {
    let index = 0;
    let errors: string[] = [];
    const batchCommandsMap = new Map<number, B24BatchCommands>();

    Object.entries(commands).forEach(([cmdName, cmd]) => {
      let cmds = batchCommandsMap.get(index) ?? {};

      if (Object.keys(cmds).length === 50) {
        batchCommandsMap.set(index, cmds);
        index++;
        cmds = batchCommandsMap.get(index) ?? {};
      }

      cmds[cmdName] = cmd;

      batchCommandsMap.set(index, cmds);
    });

    const batchResponses = await Promise.all(
      Array.from(batchCommandsMap.values()).map((bcmds) =>
        this.callBatch<B24BatchResponseMap>(bcmds, halt),
      ),
    );

    batchResponses.forEach((bres) => {
      if (
        (Array.isArray(bres.result.result_error) &&
          bres.result.result_error.length === 0) ||
        Object.keys(bres.result.result_error).length === 0
      )
        return;

      Object.entries(bres.result.result_error).forEach(
        ([cmdName, { error }]) => {
          errors.push(`${cmdName}: ${error}`);
        },
      );
    });

    if (errors.length > 0) throw new BadRequestException(errors);

    return batchResponses;
  }

  public isAvailableToDistributeOnManager() {
    const now = new Date();

    return (
      now.getDay() > 0 &&
      now.getDay() < 6 &&
      ((now.getUTCHours() >= 6 && now.getUTCHours() < 14) ||
        (now.getUTCHours() === 14 && now.getUTCMinutes() <= 30))
    );
  }

  /**
   * Get bitrix tokens
   */
  public async getTokens(): Promise<BitrixTokens> {
    if (
      this.tokens &&
      this.tokens?.access_token &&
      Date.now() < this.tokens?.expires
    )
      return this.tokens;

    const tokens = await this.tokensService.getToken(TokensServices.BITRIX_APP);

    if (!tokens || !tokens.refreshToken)
      throw new UnauthorizedException('Invalid refresh token');

    const { accessToken, refreshToken, expires } = tokens;

    if (expires && Date.now() < expires) {
      this.tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires: expires,
      };

      return this.tokens;
    }

    return this.updateAccessToken(tokens.refreshToken);
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

    this.tokensService.updateOrCreateToken(TokensServices.BITRIX_APP, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expires: expires * 1000,
    });

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

    return label ? `[url=${url}]${label}[/url]` : url;
  }

  /**
   * Return string url task
   * @param userId
   * @param taskId
   * @param label
   */
  public generateTaskUrl(userId: string, taskId: string, label?: string) {
    const url = `https://grampus.bitrix24.ru/company/personal/user/${userId}/tasks/task/view/${taskId}/`;

    return label ? `[url=${url}]${label}[/url]` : url;
  }

  /**
   * Update tokens and save in cache
   */
  public async updateTokens() {
    const tokens = await this.tokensService.getToken(TokensServices.BITRIX_APP);

    if (!tokens) throw new UnauthorizedException('Invalid update tokens');

    this.tokens = {
      access_token: tokens.accessToken,
      expires: tokens.expires,
      refresh_token: tokens.refreshToken ?? '',
    };

    return this.tokens;
  }

  /**
   * Get application bot id
   * @constructor
   */
  get BOT_ID() {
    return this.bitrixConstants.BOT_ID;
  }

  /**
   * Get bitrix domain
   * @constructor
   */
  get BITRIX_DOMAIN() {
    return this.bitrixDomain;
  }

  /**
   * Get bitrix chat id. Need for testing
   * @constructor
   */
  get TEST_CHAT_ID() {
    return this.bitrixConstants.TEST_CHAT_ID;
  }

  /**
   * Get token for validate incoming webhooks from bitrix
   * @constructor
   */
  get WEBHOOK_INCOMING_TOKEN() {
    return this.bitrixConstants.WEBHOOK_INCOMING_TOKEN;
  }

  /**
   * Returning Zlata Zimina bitrix user_id
   *
   * ---
   *
   * Возвращает ID Пользователя Битрикс24: Злата Зимина
   *
   * @constructor
   */
  get ZLATA_ZIMINA_BITRIX_ID() {
    return this.bitrixConstants.ZLATA_ZIMINA_BITRIX_ID;
  }

  get ADDY_CASES_CHAT_ID() {
    return this.bitrixConstants.ADDY.casesChatId;
  }

  get OBSERVE_MANAGER_CALLING_CHAT_ID() {
    return this.bitrixConstants.LEAD.observeManagerCallingChatId;
  }

  /**
   * Remove emoji from string
   *
   * ---
   *
   * Удаляет смайлы из строки
   *
   * @param message
   */
  public removeEmoji(message: string) {
    return emojiStrip(message) as string;
  }

  public formatPrice(
    price: number,
    locale: string = 'ru-RU',
    currency: string = 'RUB',
  ) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  /**
   * Base post request to bitrix
   * @param url
   * @param body
   * @param config
   * @private
   */
  private async post<T, U = any>(
    url: string,
    body: T,
    config?: AxiosRequestConfig<T>,
  ) {
    const response = await this.http.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return response.data;
  }

  public getRandomElement<T = any>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
  }

  public async getUserIdByAuth(authId: string) {
    try {
      const { result } = await this.post<
        object,
        B24SuccessResponse<B24UserCurrent>
      >(
        '/rest/user.current',
        {},
        {
          headers: {
            Authorization: `Bearer ${authId}`,
          },
        },
      );
      return result ?? null;
    } catch (e) {
      this.logger.error(e.toString());
      return null;
    }
  }

  public generateLeadUrlHtml(leadId: string, label?: string) {
    const url = `${this.bitrixDomain}/crm/lead/details/${leadId}/`;

    if (label) return `<a href="${url}">${label}</a>`;

    return `<a href="${url}">${url}</a>`;
  }

  get WEBHOOK_VOXIMPLANT_FINISH_CALL_TOKEN() {
    return this.bitrixConstants.WEBHOOK.voxImplant.finishCallToken;
  }
}
