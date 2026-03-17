import { WinstonLogger } from '@/config/winston.logger';
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { maybeCatchError } from '@/common/utils/catch-error';

@Injectable()
export class AddyService {
  private readonly logger = new WinstonLogger(AddyService.name, ['addy']);
  private readonly responseInterceptorLogger = new WinstonLogger(AddyService.name, ['addy']);
  private readonly requestInterceptorLogger = new WinstonLogger(AddyService.name, ['addy']);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.http = axios.create({
      baseURL: this.configService.getOrThrow<string>('addy_internal.baseUrl'),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: btoa(
          `Basic ${this.configService.getOrThrow('addy_internal.auth.login')}:${this.configService.getOrThrow('addy_internal.auth.password')}`,
        ),
      },
    });

    // Перехватчики на отправку запроса
    this.http.interceptors.request.use(
      (config) => {
        this.requestInterceptorLogger.debug({
          handler: 'request',
          data: {
            body: config.data,
            params: config.params,
          },
        });
        return config;
      },
      (err) => {
        this.requestInterceptorLogger.error({
          handler: 'request error',
          error: maybeCatchError(err),
        });

        return Promise.reject(err);
      },
    );

    // Перехватчики на получение ответа
    this.http.interceptors.response.use(
      (response) => {
        this.responseInterceptorLogger.debug({
          handler: 'response',
          response: response,
        });
        return response;
      },
      (err) => {
        this.responseInterceptorLogger.error({
          handler: 'response error',
          error: maybeCatchError(err),
        });

        return Promise.reject(err);
      },
    );
  }

  /**
   * Send invoice data to Addy Internal Service
   *
   * ---
   *
   * Отправляет данные о платеже в Addy сервис
   */
  public async sendInvoiceData(data: any) {
    try {
      const response = await this.post(
        '/v1/bx24/set-client-invoice-number',
        data,
      );
      this.logger.debug({
        handler: this.sendInvoiceData.name,
        request: data,
        response,
      });
    } catch (error) {
      this.logger.error({
        handler: this.sendInvoiceData.name,
        request: data,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Base realization for send POST request
   *
   * ---
   *
   * Базовая реализация для отправки POST запроса
   * @param url
   * @param body
   * @param config
   * @private
   */
  private async post<T = any, U = any>(
    url: string,
    body?: T,
    config: AxiosRequestConfig = {},
  ): Promise<U> {
    const { data } = await this.http.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return data;
  }
}
