import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IEnvironmentVariables } from '../../share/intrerfaces/config.interface';
import { WinstonLogger } from '../../share/logger/main';
import { maybeCatchError } from '../../share/utils/maybe-catch-error';

@Injectable()
export class AppHttpService implements OnModuleInit {
  private readonly requestLogger = new WinstonLogger(
    `${AppHttpService.name}_requests`,
    'axios/requests',
  );
  private readonly responseLogger = new WinstonLogger(
    `${AppHttpService.name}_responses`,
    'axios/responses',
  );
  private http: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<IEnvironmentVariables>,
  ) {}

  onModuleInit() {
    this.http = axios.create({
      baseURL: this.configService.getOrThrow('neuro.baseUrl', { infer: true }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.http.interceptors.request.use(
      (config) => {
        console.log(config);
        this.requestLogger.debug({
          handler: 'request interceptor',
          data: {
            ...config.data,
            ...config.params,
          },
        });
        return config;
      },
      (error) => {
        this.requestLogger.error({
          handler: 'request error interceptor',
          error: maybeCatchError(error),
        });
        return Promise.reject(error);
      },
    );

    this.http.interceptors.response.use(
      (response) => {
        this.responseLogger.debug({
          handler: 'response interceptor',
          data: response.data,
        });
        return response;
      },
      (error) => {
        this.responseLogger.error({
          handler: 'response error interceptor',
          error: maybeCatchError(error),
        });
        return Promise.reject(error);
      },
    );
  }

  public async post<B = any, R = any>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    const { data } = await this.http.post<B, AxiosResponse<R>>(
      url,
      body,
      config,
    );

    return data;
  }
}
