import { Inject, Injectable } from '@nestjs/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { TelphinConfig } from '@/common/interfaces/telphin-config.interface';
import { TelphinTokenOptions } from '@/modules/telphin/interfaces/telphin-api.interface';
import { TokensService } from '@/modules/tokens/tokens.service';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class TelphinApiService {
  private readonly logger = new WinstonLogger(
    TelphinApiService.name,
    'telphin'.split(':'),
  );
  private readonly telphinClientId: string;
  private readonly telphinClientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('TelphinApiProvider')
    private readonly telphinAPI: AxiosInstance,
    private readonly tokensService: TokensService,
  ) {
    const telphinConfig =
      this.configService.get<TelphinConfig>('telphinConfig');

    if (
      !telphinConfig ||
      Object.values(telphinConfig).filter((c) => !c).length !== 0
    )
      throw new Error(
        `${TelphinApiService.name.toUpperCase()}: Invalid config`,
      );

    const { baseUrl, clientId, clientSecret } = telphinConfig;

    this.telphinClientId = clientId;
    this.telphinClientSecret = clientSecret;
    this.telphinAPI.defaults.baseURL = baseUrl;
    this.telphinAPI.defaults.headers['Content-Type'] = 'application/json';
    this.telphinAPI.defaults.headers['Accept-Encoding'] = 'gzip';

    this.tokensService
      .getToken(TokensServices.TELPHIN)
      .then(async (response) => {
        let token: string | boolean;

        if (!response) {
          token = await this.updateToken();
        } else if (response.expires <= new Date().getTime()) {
          token = await this.updateToken();
        } else {
          token = response?.accessToken;
        }

        if (!token) {
          this.logger.error('Invalid get telphin token');
          return;
        }

        this.telphinAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
      })
      .catch((err) => this.logger.error(err));
  }

  /**
   * Update tokens in database
   *
   * ---
   *
   * Обновляет токен в БД
   */
  public async updateToken() {
    try {
      const { access_token, expires_in } =
        await this.sendRequestOnUpdateTokens();

      this.tokensService
        .updateOrCreateToken(TokensServices.TELPHIN, {
          accessToken: access_token,
          expires: new Date().getTime() + expires_in * 1000,
        })
        .then(({ message, status }) => {
          if (status) return;

          this.logger.error(`Invalid update telphin tokens in DB: ${message}`);
        });

      this.telphinAPI.defaults.headers['Authorization'] =
        `Bearer ${access_token}`;
      return access_token;
    } catch (e) {
      this.logger.error({ message: 'Invalid update telphin token', error: e });
      return false;
    }
  }

  /**
   * Send request to telphin api for get new token
   *
   * ---
   *
   * Получение нового токена от telphin
   * @private
   */
  private async sendRequestOnUpdateTokens() {
    const { data } = await this.telphinAPI.post<
      URLSearchParams,
      AxiosResponse<TelphinTokenOptions>
    >(
      '',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.telphinClientId,
        client_secret: this.telphinClientSecret,
      }),
      {
        baseURL: 'https://apiproxy.telphin.ru/oauth/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return data;
  }

  public get CLIENT_ID() {
    return this.telphinClientId;
  }

  /**
   * Base GET method to telphin
   *
   * ---
   *
   * Реализация базового GET метода для запросов к telphin
   *
   * @param url
   */
  public async get<T = any>(url: string): Promise<T | null> {
    try {
      const { data } = await this.telphinAPI.get<T>(url);

      return data;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  /**
   * Base POST method to telphin
   *
   * ---
   *
   * Реализация базового POST метода для запросов к telphin
   * @param url
   * @param body
   * @param config
   */
  public async post<T, U = any>(
    url: string,
    body: U,
    config?: AxiosRequestConfig,
  ): Promise<U | null> {
    try {
      const { data } = await this.telphinAPI.post<T, AxiosResponse<U>>(
        url,
        body,
        config,
      );

      return data;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  /**
   * Base DELETE method to telphin
   *
   * ---
   *
   * Реализация базового DELETE метода для запросов к telphin
   *
   * @param url
   * @param config
   */
  public async delete<T, U = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<U | null> {
    try {
      const { data } = await this.telphinAPI.delete<T, AxiosResponse<U>>(
        url,
        config,
      );

      return data;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }
}
