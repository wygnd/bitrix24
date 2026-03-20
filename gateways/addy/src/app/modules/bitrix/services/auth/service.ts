import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IEnvironmentOptions } from '@shared/interfaces/config/main';
import { WinstonLogger } from '@shared/logger/winston.logger';
import { maybeCatchError } from '@shared/utils/catch-error';
import {
  IBitrixAuthResponse,
  IBitrixAuthSecrets,
  IBitrixAuthTokens,
} from '../../interfaces/auth/interface';
import { RedisService } from '../../../redis/services/service';
import { REDIS_KEYS } from '../../../redis/constants/constants';
import {
  IB24AvailableMethods,
  TB24BatchCommands,
} from '../../interfaces/api/interface';
import {
  IB24BatchResponseMap,
  IB24Response,
} from '../../interfaces/api/responses/interface';
import qs from 'qs';

@Injectable()
export class BitrixApiService {
  private readonly logger = new WinstonLogger(
    BitrixApiService.name,
    'bitrix/api/service',
  );
  private readonly requestInterceptorLogger = new WinstonLogger(
    'Requests',
    'bitrix/api/interceptors',
  );
  private readonly responseInterceptorLogger = new WinstonLogger(
    'Responses',
    'bitrix/api/interceptors',
  );
  private http: AxiosInstance;
  private bitrixSecrets: IBitrixAuthSecrets;

  constructor(
    private readonly configService: ConfigService<IEnvironmentOptions>,
    private readonly redisService: RedisService,
  ) {
    // Создаем инстанс
    this.http = axios.create({
      baseURL: configService.getOrThrow('bitrix.base_url', { infer: true }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
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

    this.bitrixSecrets = {
      clientId: configService.getOrThrow('bitrix.client_id', { infer: true }),
      clientSecret: configService.getOrThrow('bitrix.client_secret', {
        infer: true,
      }),
    };
  }

  /**
   * Send request to Bitrix24
   *
   * ---
   *
   * Отправка запроса в Битрикс24
   * @param method
   * @param params
   */
  public async callMethod<
    T extends Record<string, any> = Record<string, any>,
    R = any,
  >(method: IB24AvailableMethods, params: Partial<T> = {}) {
    const { access_token } = await this.getTokens();
    return this.post<Partial<T>, IB24Response<R>>(`/rest/${method}`, {
      ...params,
      auth: access_token,
    });
  }

  /**
   * Send batch reqeust to Bitrix24
   *
   * ---
   *
   * Отправка пакета запросов в Битрикс24
   * @param commands
   * @param halt
   */
  public async callBatch<T extends Record<string, any>>(
    commands: TB24BatchCommands,
    halt = false,
  ) {
    const { access_token } = await this.getTokens();

    const cmd = Object.entries(commands).reduce(
      (acc, [key, { method, params }]) => {
        acc[key] = `${method}?${qs.stringify(params)}`;
        return acc;
      },
      {} as Record<string, string>,
    );

    const response = (await this.post('/rest/batch', {
      cmd: cmd,
      halt: halt,
      auth: access_token,
    })) as IB24BatchResponseMap;

    const errors = Object.entries(response.result.result_error).reduce(
      (acc, [command, errorData]) => {
        acc += `${command}: ${errorData.error_description}\n`;
        return acc;
      },
      '' as string,
    );

    if (errors && halt) throw new Error(errors);

    return response as IB24BatchResponseMap<T>;
  }

  /**
   * Form batch batches request and return form response of object result
   *
   * ---
   *
   * Формирует пакет с пакетами запросов и возвращает отформатированный объект результата
   * @param commands
   * @param halt
   */
  async callBatches<T extends Record<string, any> = Record<string, any>>(
    commands: TB24BatchCommands,
    halt = false,
  ): Promise<Record<string, T[keyof T]>> {
    let index = 0;
    let errors: string[] = [];
    const batchCommandsMap = new Map<number, TB24BatchCommands>();

    Object.entries(commands).forEach(([cmdName, cmd]) => {
      let cmds = batchCommandsMap.get(index) ?? {};

      if (Object.keys(cmds).length === 50) {
        batchCommandsMap.set(index, cmds);
        index++;
        cmds = batchCommandsMap.get(index) ?? {};
      }

      cmds[cmdName] = cmd;

      batchCommandsMap.set(index, cmds);
    });

    const batchResponses = await Promise.all(
      Array.from(batchCommandsMap.values()).map((commands) => {
        return this.callBatch<Record<keyof T, T[keyof T]>>(commands, halt);
      }),
    );

    batchResponses.forEach((response) => {
      if (
        (Array.isArray(response.result.result_error) &&
          response.result.result_error.length === 0) ||
        Object.keys(response.result.result_error).length === 0
      )
        return;

      Object.entries(response.result.result_error).forEach(
        ([cmdName, { error, error_description }]) => {
          errors.push(`${cmdName}: ${error}, ${error_description}`);
        },
      );
    });

    if (errors.length > 0) throw new BadRequestException(errors);

    return batchResponses.reduce<Record<string, T[keyof T]>>(
      (acc, { result: { result } }) => {
        Object.entries(result).forEach(([commandName, response]) => {
          acc[commandName] = response;
        });

        return acc;
      },
      {},
    );
  }


  /**
   * Get access and refresh bitrix tokens
   *
   * ---
   *
   * Получить access и refresh токены битрикс
   * @private
   */
  private async getTokens(): Promise<IBitrixAuthTokens> {
    const nowDatetime = new Date();
    const tokens = await this.redisService.get<IBitrixAuthTokens>(
      REDIS_KEYS.BITRIX_AUTH_TOKENS,
    );

    if (!tokens) {
      this.logger.fatal('No tokens found.');
      throw new UnauthorizedException('Invalid bitrix credentials');
    }

    // Если действие токена закончилось: обновляем
    if (tokens.expires <= nowDatetime.getTime()) {
      return this.updateAccessToken(tokens.refresh_token);
    }

    return tokens;
  }

  /**
   * Update access token and save his in redis cache
   *
   * ---
   *
   * Обновляет токен доступа и сохраняет его в кеш
   * @param refreshToken
   * @private
   */
  private async updateAccessToken(
    refreshToken: string,
  ): Promise<IBitrixAuthTokens> {
    const { access_token, refresh_token, expires } = await this.post<
      object,
      IBitrixAuthResponse
    >(
      '',
      {},
      {
        baseURL: this.configService.getOrThrow('bitrix.oauth_base_url', {
          infer: true,
        }),
        params: {
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          client_id: this.bitrixSecrets.clientId,
          client_secret: this.bitrixSecrets.clientSecret,
        },
      },
    );

    const newTokens: IBitrixAuthTokens = {
      access_token,
      refresh_token,
      expires: expires * 1000,
    };

    await this.redisService.set<IBitrixAuthTokens>(
      REDIS_KEYS.BITRIX_AUTH_TOKENS,
      newTokens,
    );

    return newTokens;
  }

  /**
   * Save tokens in redis
   *
   * ---
   *
   * Сохранение токенов в кеш
   * @temporary
   * @param data
   */
  public async saveTokens(data: IBitrixAuthTokens): Promise<boolean> {
    try {
      await this.redisService.set<IBitrixAuthTokens>(
        REDIS_KEYS.BITRIX_AUTH_TOKENS,
        data,
      );
      return true;
    } catch (err) {
      this.logger.error({
        handler: this.saveTokens.name,
        error: maybeCatchError(err),
      });
      return false;
    }
  }

  private async post<T, U = any>(
    url: string,
    body: T,
    config?: AxiosRequestConfig<T>,
  ) {
    const response = await this.http.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return response.data;
  }
}
