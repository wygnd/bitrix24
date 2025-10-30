import { Inject, Injectable } from '@nestjs/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { HeadHunterConfig } from '@/common/interfaces/headhunter-config.interface';
import { HHResumeInterface } from '@/modules/headhunter/interfaces/headhunter-resume.interface';
import { HHVacancyInterface } from '@/modules/headhunter/interfaces/headhunter-vacancy.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { HeadHunterAuthTokens } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-auth.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { BitrixMessageService } from '@/modules/bitirx/modules/im/im.service';

@Injectable()
export class HeadHunterService {
  private readonly client_id: string;
  private readonly client_secret: string;
  private readonly redirect_uri: string;
  private readonly auth_data?: HeadHunterAuthTokens;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @Inject('HeadHunterApiService')
    private readonly http: AxiosInstance,
    private readonly bitrixMessageService: BitrixMessageService,
  ) {
    const headHunterConfig =
      configService.get<HeadHunterConfig>('headHunterConfig');

    if (!headHunterConfig) throw Error('Invalid head hunter config');

    const { clientId, clientSecret, baseUrl, applicationToken, redirectUri } =
      headHunterConfig;

    if (
      !clientId ||
      !clientSecret ||
      !baseUrl ||
      !applicationToken ||
      !redirectUri
    )
      throw new Error('Invalid head hunter fields');

    this.http.defaults.baseURL = baseUrl;

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
  }

  async get<T, U = any>(url: string, config?: AxiosRequestConfig<T>) {
    const { data } = await this.http.get<T, AxiosResponse<U>>(url, config);
    return data;
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

  async getResumeById(resumeId: string) {
    return this.get<null, HHResumeInterface>(`/resumes/${resumeId}`);
  }

  async getVacancyById(vacancyOd: string) {
    return this.get<null, HHVacancyInterface>(`/vacancies/${vacancyOd}`);
  }

  async notifyAboutInvalidCredentials() {
    await this.bitrixMessageService.sendPrivateMessage({
      DIALOG_ID: '376',
      MESSAGE:
        'Необходимо обновить авторизацию на hh.ru: [br]' +
        'https://hh.ru/oauth/authorize?' +
        'response_type=code&' +
        `client_id=${this.client_id}` +
        `&redirect_uri=${this.redirect_uri}`,
    });
  }

  async updateToken() {
    const tokens = await this.getAuthData();

    if (!tokens) return false;

    this.http.defaults.headers['Authorization'] =
      `Bearer ${tokens.access_token}`;
  }

  private async getAuthData() {
    const now = new Date();
    if (this.auth_data) {
      const { expires } = this.auth_data;

      const expiresDate = new Date(expires);

      if (now.toLocaleDateString() !== expiresDate.toLocaleDateString()) {
        await this.notifyAboutInvalidCredentials();
        return null;
      }

      return this.auth_data;
    }

    await this.notifyAboutInvalidCredentials();
    return null;
  }
}
