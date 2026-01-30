import { Injectable } from '@nestjs/common';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AvitoApiService {
  constructor(private readonly http: HttpService) {}

  async post<T, U = any>(url: string, body: T, config?: AxiosRequestConfig<T>) {
    const { data } = await this.http.axiosRef.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return data;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig<T>) {
    const { data } = await this.http.axiosRef.get<any, AxiosResponse<T>>(
      url,
      config,
    );

    return data;
  }
}
