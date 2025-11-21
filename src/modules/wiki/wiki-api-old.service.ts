import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { WikiConfig } from '@/common/interfaces/wiki-config.interface';

@Injectable()
export class WikiApiServiceOld {
  constructor(
    private readonly configService: ConfigService,
    @Inject('WikiApiServiceOld')
    private readonly http: AxiosInstance,
  ) {
    const wikiConfig = this.configService.get<WikiConfig>('wikiConfig');

    if (!wikiConfig)
      throw new Error('WIKI OLD MODULE: Invalid init. config is not defined');

    const { baseApiUrlOld } = wikiConfig;

    if (!baseApiUrlOld)
      throw new Error(
        'WIKI OLD MODULE: Invalid field: baseApiUrlOld must be defined',
      );

    this.http.defaults.baseURL = baseApiUrlOld;
    this.http.defaults.headers.common['Content-Type'] = 'application/json';
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
