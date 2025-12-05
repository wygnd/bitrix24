import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { HeadHunterConfig } from '@/common/interfaces/headhunter-config.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { HeadHunterAuthTokens } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-auth.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { BitrixMessageService } from '@/modules/bitirx/modules/im/im.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { HHMeInterface } from '@/modules/headhunter/interfaces/headhunter-me.interface';

@Injectable()
export class HeadHunterService {
  private readonly logger = new Logger(HeadHunterService.name);
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
    private readonly bitrixMessageService: BitrixMessageService,
    private readonly bitrixService: BitrixService,
  ) {
    const headHunterConfig =
      configService.get<HeadHunterConfig>('headHunterConfig');

    if (!headHunterConfig) throw Error('Invalid head hunter config');

    const { clientId, clientSecret, baseUrl, redirectUri } = headHunterConfig;

    if (!clientId || !clientSecret || !baseUrl || !redirectUri)
      throw new Error('Invalid head hunter fields');

    this.http.defaults.baseURL = baseUrl;
    this.http.defaults.headers.common['Content-Type'] = 'application/json';
    this.http.defaults.headers.common['Accept'] = 'application/json';

    // Check auth data.
    // Send message about update credentials If not exists
    this.redisService
      .get<HeadHunterAuthTokens>(REDIS_KEYS.HEADHUNTER_AUTH_DATA)
      .then(async (data) => {
        if (!data) {
          await this.notifyAboutInvalidCredentials();
          return new Error('Invalid hh auth data');
        }

        const { access_token } = data;

        this.http.defaults.headers['Authorization'] = `Bearer ${access_token}`;
      })
      .catch((error) => new Error(error));

    this.client_id = clientId;
    this.client_secret = clientSecret;
    this.redirect_uri = redirectUri;

    this.redisService
      .get<string>(REDIS_KEYS.HEADHUNTER_EMPLOYER_ID)
      .then(async (employerId) => {
        if (!employerId) {
          const me = await this.get<object, HHMeInterface>('/me');
          this.employer_id = me.employer.id;
          return;
        }
        this.employer_id = employerId;
      })
      .catch((err) => this.logger.error(err));
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

    await this.bitrixMessageService.sendPrivateMessage({
      DIALOG_ID: '190', // Екатерина Туркатова
      MESSAGE:
        'Необходимо обновить авторизацию на hh.ru: [br]' +
        'https://hh.ru/oauth/authorize?' +
        'response_type=code&' +
        `client_id=${this.client_id}` +
        `&redirect_uri=${this.redirect_uri}`,
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
    await this.bitrixMessageService.sendPrivateMessage({
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE:
        'Обновлены токены авторизации для hh.ru[br]' + JSON.stringify(tokens),
    });
  }

  private async getAuthData() {
    const now = new Date();

    if (!this.auth_data) {
      const tokensFromCache = await this.redisService.get<HeadHunterAuthTokens>(
        REDIS_KEYS.HEADHUNTER_AUTH_DATA,
      );

      if (!tokensFromCache) {
        await this.notifyAboutInvalidCredentials();
        return null;
      }

      this.auth_data = tokensFromCache;
      return this.auth_data;
    }

    const { expires } = this.auth_data;

    const expiresDate = new Date(expires);

    if (now.toLocaleDateString() !== expiresDate.toLocaleDateString()) {
      const tokens = await this.redisService.get<HeadHunterAuthTokens>(
        REDIS_KEYS.HEADHUNTER_AUTH_DATA,
      );

      if (!tokens || !tokens.expires || !tokens.access_token) {
        await this.notifyAboutInvalidCredentials();
        return null;
      }

      const expiresCacheDate = new Date(tokens.expires);

      if (expiresCacheDate.toLocaleDateString() !== now.toLocaleDateString()) {
        await this.notifyAboutInvalidCredentials();
        return null;
      }

      this.auth_data = tokens;
      return this.auth_data;
    }

    return this.auth_data;
  }
}
