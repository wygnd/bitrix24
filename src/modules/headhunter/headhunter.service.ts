import { Inject, Injectable } from '@nestjs/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/modules/redis/redis.constants';
import { ConfigService } from '@nestjs/config';
import { HeadHunterConfig } from '@/common/interfaces/headhunter-config.interface';

@Injectable()
export class HeadHunterService {
  private readonly client_id: string;
  private readonly client_secret: string;

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisService: Redis,
    private readonly configService: ConfigService,
    @Inject('HeadHunterApiService')
    private readonly http: AxiosInstance,
  ) {
    const headHunterConfig =
      configService.get<HeadHunterConfig>('headHunterConfig');

    if (!headHunterConfig) throw Error('Invalid head hunter config');

    const { clientId, clientSecret, baseUrl, applicationToken } =
      headHunterConfig;

    if (!clientId || !clientSecret || !baseUrl || !applicationToken)
      throw new Error('Invalid head hunter fields');

    this.http.defaults.baseURL = baseUrl;
    this.http.defaults.headers['Authorization'] = `Bearer ${applicationToken}`;

    this.client_id = clientId;
    this.client_secret = clientSecret;
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
}
