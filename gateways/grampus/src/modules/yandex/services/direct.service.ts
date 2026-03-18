import { Injectable } from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { maybeCatchError } from '@/common/utils/catch-error';
import {
  IYandexDirectAccountManagementAccountOptions,
  IYandexDirectAccountManagementGetResponse,
} from '@/modules/yandex/interfaces/direct/account/get/responses/interface';
import { IYandexDirectAccountManagementGetRequest } from '@/modules/yandex/interfaces/direct/account/get/requests/interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  IYandexDirectAccountManagementInvoiceActionsResultOptions,
  IYandexDirectAccountManagementInvoiceResponse,
} from '@/modules/yandex/interfaces/direct/account/invoice/responses/interface';
import {
  IYandexDirectAccountManagementGetPaymentOptions,
  IYandexDirectAccountManagementInvoiceRequest,
} from '@/modules/yandex/interfaces/direct/account/invoice/requests/interface';
import { createHash } from 'crypto';

@Injectable()
export class YandexDirectService {
  private readonly logger = new WinstonLogger(YandexDirectService.name, [
    'yandex',
    'direct',
  ]);
  private readonly http: AxiosInstance;
  private readonly authToken: string;
  private readonly masterToken: string;
  private readonly login: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.http = axios.create({
      baseURL: configService.getOrThrow<string>('yandex.direct.baseUrl'),
    });

    this.authToken = configService.getOrThrow<string>(
      'yandex.direct.authToken',
    );
    this.masterToken = configService.getOrThrow<string>(
      'yandex.direct.masterToken',
    );
    this.login = configService.getOrThrow<string>('yandex.direct.login');
  }

  /**
   * Get account management by login
   *
   * ---
   *
   * Получить список общих счетов по логину аккаунта
   * @param logins
   */
  public async getAccountManagementListByLogins(
    logins: string[],
  ): Promise<IYandexDirectAccountManagementAccountOptions[]> {
    try {
      const accountList = await this.redisService.get<
        IYandexDirectAccountManagementAccountOptions[]
      >(REDIS_KEYS.YANDEX_DIRECT_ACCOUNT_MANAGEMENT_LIST);

      // Проверяем есть ли в кеше, если есть пытаемся найти в списке
      if (accountList) {
        const accounts = accountList.reduce<
          IYandexDirectAccountManagementAccountOptions[]
        >((acc, account) => {
          if (logins.includes(account.Login)) acc.push(account);
          return acc;
        }, []);

        if (accounts.length > 0) return accounts;
      }

      const response = await this.post<
        IYandexDirectAccountManagementGetRequest,
        IYandexDirectAccountManagementGetResponse
      >('', {
        method: 'AccountManagement',
        param: {
          Action: 'Get',
          SelectionCriteria: {
            Logins: logins,
          },
        },
      });

      this.logger.debug({
        handler: this.getAccountManagementListByLogins.name,
        message: 'check response',
        request: logins,
        response,
      });

      const { Accounts: accounts } = response.data;

      this.redisService.set<IYandexDirectAccountManagementAccountOptions[]>(
        REDIS_KEYS.YANDEX_DIRECT_ACCOUNT_MANAGEMENT_LIST,
        accounts,
      );

      return accounts;
    } catch (error) {
      this.logger.error({
        handler: this.getAccountManagementListByLogins.name,
        request: logins,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  public async generateAccountManagementInvoice(
    payments: IYandexDirectAccountManagementGetPaymentOptions[],
  ): Promise<IYandexDirectAccountManagementInvoiceActionsResultOptions[]> {
    try {
      const operationNumber = Math.floor(Math.random() * 100);
      const action = 'Invoice';
      const method = 'AccountManagement';

      const response = await this.post<
        IYandexDirectAccountManagementInvoiceRequest,
        IYandexDirectAccountManagementInvoiceResponse
      >('', {
        method: method,
        finance_token: this.generateFinanceToken(
          method,
          action,
          operationNumber,
        ),
        operation_num: operationNumber,
        param: {
          Action: action,
          Payments: payments,
        },
      });

      this.logger.debug({
        handler: this.generateAccountManagementInvoice.name,
        request: payments,
        response,
      });

      return response.data?.ActionsResult ?? response.data ?? response;
    } catch (error) {
      this.logger.error({
        handler: this.generateAccountManagementInvoice.name,
        request: payments,
        response: maybeCatchError(error),
      });

      throw error;
    }
  }

  private generateFinanceToken(
    service: string,
    method: string,
    operationNumber: number,
  ): string {
    const content = `${this.masterToken}${operationNumber}${service}${method}${this.login}`;
    this.logger.log(content);
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Base realization POST request
   *
   * ---
   *
   * Базовая реализация POST запроса
   * @private
   */
  private async post<T, U>(
    url: string,
    body: T,
    config?: AxiosRequestConfig,
  ): Promise<U> {
    const { data } = await this.http.post<T, AxiosResponse<U>>(
      url,
      { ...body, token: this.authToken, locale: 'ru' },
      config,
    );

    return data;
  }
}
