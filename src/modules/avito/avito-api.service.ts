import { Inject, Injectable } from '@nestjs/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { AvitoConfig } from '@/common/interfaces/avito-config.interface';

@Injectable()
export class AvitoApiService {
  constructor(
    private readonly configService: ConfigService,
    @Inject('AvitoApiService')
    private readonly http: AxiosInstance,
  ) {
    const { baseUrl } =
      this.configService.getOrThrow<AvitoConfig>('avitoConfig');

    if (!baseUrl) throw new Error('AVITO MODULE: Invalid base url');

    this.http.defaults.baseURL = baseUrl;
    this.http.defaults.headers.common['Content-Type'] = 'application/json';
    this.http.defaults.headers.common['Accept'] = 'application/json';
  }

  async post<T, U = any>(url: string, body: T, config?: AxiosRequestConfig<T>) {
    const { data } = await this.http.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return data;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig<T>) {
    const { data } = await this.http.get<any, AxiosResponse<T>>(url, config);

    return data;
  }
}
