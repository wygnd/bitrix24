import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class MetrikaApiService {
  private readonly logger = new WinstonLogger(
    MetrikaApiService.name,
    'yandex:metrika'.split(':'),
  );

  constructor(private readonly http: HttpService) {}

  async get<T = any, U = any>(url: string, config?: AxiosRequestConfig<T>) {
    try {
      const { data } = await this.http.axiosRef.get<T, AxiosResponse<U>>(
        url,
        config,
      );

      this.logger.debug({
        handler: 'get',
        request: url,
        response: data,
      });

      return data as U;
    } catch (error) {
      console.log(error);
      this.logger.error({
        handler: 'get',
        request: url,
        response: error,
      });

      throw error;
    }
  }
}
