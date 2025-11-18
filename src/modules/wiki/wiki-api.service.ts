import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { WikiConfig } from '@/common/interfaces/wiki-config.interface';

@Injectable()
export class WikiApiService {
  constructor(
    private readonly configService: ConfigService,
    @Inject('WikiApiService')
    private readonly http: AxiosInstance,
  ) {
    const wikiConfig = this.configService.get<WikiConfig>('wikiConfig');

    if (!wikiConfig)
      throw new Error('WIKI MODULE: Invalid init. config is not defined');

    const { baseApiUrl } = wikiConfig;

    if (!baseApiUrl)
      throw new Error('WIKI MODULE: Invalid field: baseApiUrl must be defined');

    this.http.defaults.baseURL = baseApiUrl;
    this.http.defaults.headers.common['Content-Type'] = 'application/json';
    this.http.defaults.headers.common[''] = 'deniska-pipiska';
  }

  async post<T, U = any>(url: string, body: T, config?: AxiosRequestConfig<T>) {
    const { data } = await this.http.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return data;
  }
}
