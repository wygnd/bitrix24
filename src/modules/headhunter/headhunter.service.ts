import { Inject, Injectable } from '@nestjs/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { HeadHunterConfig } from '@/common/interfaces/headhunter-config.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { HeadHunterAuthTokens } from '@/modules/bitrix/modules/integration/headhunter/interfaces/headhunter-auth.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import { HHMeInterface } from '@/modules/headhunter/interfaces/headhunter-me.interface';
import { TokensService } from '@/modules/tokens/tokens.service';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixMessagesUseCase } from '@/modules/bitrix/application/use-cases/messages/messages.use-case';

@Injectable()
export class HeadHunterService {
  private readonly logger = new WinstonLogger(HeadHunterService.name);
  private readonly client_id: string;
  private readonly client_secret: string;
  private readonly redirect_uri: string;
  private auth_data?: HeadHunterAuthTokens;
  private employer_id: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @Inject('HeadHunterApiService')
    private readonly http: AxiosInstance,
    private readonly bitrixMessages: BitrixMessagesUseCase,
    private readonly bitrixService: BitrixApiService,
    private readonly tokensService: TokensService,
  ) {
    const headHunterConfig =
      configService.get<HeadHunterConfig>('headHunterConfig');

    if (!headHunterConfig) throw Error('Invalid head hunter config');

    // Check config not empty values
    const checkEmptyValues = Object.entries(headHunterConfig).filter(
      ([, c]) => !c,
    );

    if (checkEmptyValues.length !== 0)
      throw new Error(
        `Invalid head hunter fields: ${checkEmptyValues.map(([name]) => name).join(', ')}`,
      );

    const { clientId, clientSecret, baseUrl, redirectUri } = headHunterConfig;

    this.http.defaults.baseURL = baseUrl;
    this.http.defaults.headers.common['Content-Type'] = 'application/json';
    this.http.defaults.headers.common['Accept'] = 'application/json';

    // Check auth data.
    // Send message about update credentials If not exists
    this.tokensService.getToken(TokensServices.HH).then(async (tokens) => {
      if (!tokens) {
        this.notifyAboutInvalidCredentials();
        this.logger.error('Invalid headhunter authorization');
        return;
      }

      this.http.defaults.headers.common['Authorization'] =
        `Bearer ${tokens.accessToken}`;

      this.get<object, HHMeInterface>('/me')
        .then((me) => {
          this.employer_id = me.employer.id;
        })
        .catch(() => {
          this.notifyAboutInvalidCredentials();
        });
    });

    this.client_id = clientId;
    this.client_secret = clientSecret;
    this.redirect_uri = redirectUri;
  }

  async get<T = any, U = any>(url: string, config?: AxiosRequestConfig<T>) {
    const { data } = await this.http.get<T, AxiosResponse<U>>(url, config);
    return data as U;
  }

  async post<T, U = any>(url: string, body: T, config?: AxiosRequestConfig<T>) {
    const { data } = await this.http.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return data;
  }

  get HH_CLIENT_ID() {
    return this.client_id;
  }

  get HH_CLIENT_SECRET() {
    return this.client_secret;
  }

  get REDIRECT_URI() {
    return this.redirect_uri;
  }

  get EMPLOYER_ID() {
    return this.employer_id;
  }

  async notifyAboutInvalidCredentials() {
    const wasSendingNotification = await this.redisService.get<boolean>(
      REDIS_KEYS.HEADHUNTER_NEED_UPDATE_AUTH_SENDING,
    );

    if (wasSendingNotification) return;

    await this.bitrixMessages.sendPrivateMessage({
      DIALOG_ID: 'chat68032', // Chat Отклики HH.ru
      MESSAGE:
        '[USER=190][/USER][br]' +
        'Необходимо обновить авторизацию на hh.ru: [br]' +
        'https://hh.ru/oauth/authorize?' +
        'response_type=code&' +
        `client_id=${this.client_id}&` +
        `redirect_uri=${this.redirect_uri}[br][br]Строго от аккаунта hh.ru Екатерины Туркатовой`,
      SYSTEM: 'Y',
    });

    await this.redisService.set<boolean>(
      REDIS_KEYS.HEADHUNTER_NEED_UPDATE_AUTH_SENDING,
      true,
      3600,
    );
  }

  async updateToken() {
    const tokens = await this.getAuthData();

    if (!tokens) return false;

    this.http.defaults.headers['Authorization'] =
      `Bearer ${tokens.access_token}`;

    // Temporary
    this.bitrixMessages.sendPrivateMessage({
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE:
        'Обновлены токены авторизации для hh.ru[br]' + JSON.stringify(tokens),
    });

    return true;
  }

  private async getAuthData() {
    const now = new Date();

    if (!this.auth_data) {
      const tokens = await this.tokensService.getToken(TokensServices.HH);

      if (!tokens) {
        this.notifyAboutInvalidCredentials();
        return null;
      }

      this.auth_data = {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken ?? '',
        expires: tokens.expires,
      };
      return this.auth_data;
    }

    const { expires } = this.auth_data;

    const expiresDate = new Date(expires);

    if (now.toLocaleDateString() !== expiresDate.toLocaleDateString()) {
      const tokens = await this.tokensService.getToken(TokensServices.HH);

      if (!tokens) {
        this.notifyAboutInvalidCredentials();
        return null;
      }

      const expiresCacheDate = new Date(tokens.expires);

      if (expiresCacheDate.toLocaleDateString() !== now.toLocaleDateString()) {
        this.notifyAboutInvalidCredentials();
        return null;
      }

      this.auth_data = {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken ?? '',
        expires: tokens.expires,
      };
      return this.auth_data;
    }

    return this.auth_data;
  }
}
