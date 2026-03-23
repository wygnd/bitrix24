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
  IYandexDirectGenerateNumberByLoginResponse,
} from '@/modules/yandex/interfaces/direct/account/invoice/responses/interface';
import {
  IYandexDirectAccountManagementGetPaymentOptions,
  IYandexDirectAccountManagementInvoiceRequest,
  IYandexDirectGenerateNumberByLoginRequest,
} from '@/modules/yandex/interfaces/direct/account/invoice/requests/interface';
import { createHash } from 'crypto';
import { RobotsService } from '@/shared/microservices/modules/robots/services/service';

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
    private readonly robotsService: RobotsService,
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

  /**
   * Get AccountId by Login
   *
   * ---
   *
   * Получает accoutId по Login
   */
  public async getAccountManagementByLogin(login: string): Promise<number> {
    try {
      const accounts = await this.getAccountManagementListByLogins([login]);

      if (accounts.length == 0) return 0;

      return (
        accounts.find((account) => account.Login === login)?.AccountID ?? 0
      );
    } catch (error) {
      this.logger.error({
        handler: this.getAccountManagementByLogin.name,
        request: login,
        response: maybeCatchError(error),
      });

      return 0;
    }
  }

  /**
   * Generate invoice url
   *
   * ---
   *
   * Генерирует платежную ссылку
   * @param payments
   */
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

  /**
   * Generate invoice number by Login
   *
   * ---
   *
   * Генерирует счет по Login
   */
  public async generateInvoiceNumberByLogin(
    fields: IYandexDirectGenerateNumberByLoginRequest,
  ): Promise<IYandexDirectGenerateNumberByLoginResponse | null> {
    try {
      const { login, with_file = false } = fields;
      const accountId = await this.getAccountManagementByLogin(login);

      // Если не нашли accountId: выходим
      if (!accountId) {
        this.logger.fatal({
          handler: this.generateInvoiceNumberByLogin.name,
          request: {
            login,
            accountId,
          },
          error: `Не удалось найти accountId по Login: ${login}`,
        });
        return null;
      }

      // Генерируем URL
      const generateInvoiceUrlResponse =
        await this.generateAccountManagementInvoice([
          {
            AccountID: accountId,
            Amount: 1,
            Currency: 'RUB',
          },
        ]);

      // Если не получилось сгенерировать invoice_url: выходим
      if (
        generateInvoiceUrlResponse.length === 0 ||
        !('URL' in generateInvoiceUrlResponse[0])
      ) {
        this.logger.fatal({
          handler: this.generateInvoiceNumberByLogin.name,
          request: {
            login,
            accountId,
            generateInvoiceUrlResponse,
          },
          error: `Не удалось сгенерировать invoice url по AccountId: ${accountId}`,
        });
        return null;
      }

      // Пытаемся получить номер счета
      const { status, invoice_number, file_data } =
        await this.robotsService.sendRequestForGetInvoiceNumber({
          invoice_url: generateInvoiceUrlResponse[0].URL,
          need_file: with_file,
        });

      // Если не получилось достать номер счета: выходим
      if (!status || !invoice_number) {
        this.logger.fatal({
          handler: this.generateInvoiceNumberByLogin.name,
          request: {
            login,
            generateInvoiceUrlResponse,
          },
          response: { status, invoice_number },
          error: 'Не получилось достать номер счета из ссылки',
        });
        return null;
      }

      return { invoice_number, file_data };
    } catch (error) {
      this.logger.error({
        handler: this.generateInvoiceNumberByLogin.name,
        request: fields,
        error: maybeCatchError(error),
      });

      return null;
    }
  }
}
