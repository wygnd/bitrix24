import { Inject, Injectable } from '@nestjs/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class AppHttpService {
  constructor(
    @Inject('AppHttpApiService')
    private readonly http: AxiosInstance,
  ) {
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
