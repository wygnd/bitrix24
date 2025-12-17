import { Injectable } from '@nestjs/common';
import { TelphinApiService } from '@/modules/telphin/telphin-api.service';
import { TelphinUserInfo } from '@/modules/tokens/interfaces/telphin-user.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  TelphinExtensionItem,
  TelphinExtensionItemExtraParams,
} from '@/modules/telphin/interfaces/telphin-extension.interface';
import { TelphinGetCallListResponse } from '@/modules/telphin/interfaces/telphin-call.interface';
import { TelphinExternalPhone } from '@/modules/telphin/interfaces/telpin-external-phone.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { TelphinInternalPhone } from '@/modules/telphin/interfaces/telphin-internal-phone.interface';

@Injectable()
export class TelphinService {
  private readonly logger = new WinstonLogger(
    TelphinService.name,
    'telphin'.split(':'),
  );

  constructor(
    private readonly telphinApiService: TelphinApiService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get current calls from telphin
   *
   * ---
   *
   * Получение текущих звонков с telphin
   * @param clientId
   */
  public async getCurrentCalls(clientId: number) {
    const callList =
      await this.telphinApiService.get<TelphinGetCallListResponse>(
        `/client/${clientId}/current_calls/`,
      );

    return callList?.call_list ? callList.call_list : [];
  }

  public async finishCall(extensionId: string, callId: string) {
    return this.telphinApiService.delete(
      `/extension/${extensionId}/current_calls/${callId}`,
    );
  }

  /**
   * Get user info/application from telphin
   *
   * ---
   *
   * Получить информацию о текущем пользователе/приложении
   */
  public async getUserInfo(): Promise<TelphinUserInfo | null> {
    const userInfoFromCache = await this.redisService.get<TelphinUserInfo>(
      REDIS_KEYS.TELPHIN_USER_INFO,
    );

    if (userInfoFromCache) return userInfoFromCache;

    const userInfo =
      await this.telphinApiService.get<TelphinUserInfo>(`/user/`);

    if (!userInfo) return null;

    this.redisService.set<TelphinUserInfo>(
      REDIS_KEYS.TELPHIN_USER_INFO,
      userInfo,
      3600, // 1 hour
    );

    return userInfo;
  }

  /**
   * Get extension list from telphin
   *
   * ---
   *
   * Получить список внутренних номеров с telphin
   * @param clientId
   */
  public async getClientExtensionList(
    clientId: number,
  ): Promise<TelphinExtensionItem[] | null> {
    const extensionsFromCache = await this.redisService.get<
      TelphinExtensionItem[]
    >(REDIS_KEYS.TELPHIN_EXTENSION_LIST);

    if (extensionsFromCache) return extensionsFromCache;

    const extensions = await this.telphinApiService.get<TelphinExtensionItem[]>(
      `/client/${clientId}/extension/`,
    );

    if (!extensions) return null;

    this.redisService.set<TelphinExtensionItem[]>(
      REDIS_KEYS.TELPHIN_EXTENSION_LIST,
      extensions,
      900, // 15 minutes
    );

    return extensions;
  }

  public async getClientExtensionById(clientId: number, extensionId: number) {
    const extensionFromCache =
      await this.redisService.get<TelphinExtensionItem>(
        REDIS_KEYS.TELPHIN_EXTENSION_ITEM + extensionId,
      );

    if (extensionFromCache) return extensionFromCache;

    const extension = await this.telphinApiService.get<TelphinExtensionItem>(
      `/client/${clientId}/extension/${extensionId}`,
    );

    if (!extension) return null;

    this.redisService.set<TelphinExtensionItem>(
      REDIS_KEYS.TELPHIN_EXTENSION_ITEM + extensionId,
      extension,
      300, // 5 minutes
    );

    return extension;
  }

  /**
   * Get extension by bitrix user id
   *
   * ---
   *
   * Получить внутренний номер по ID пользователя из битрикс24
   *
   * @param clientId
   * @param bitrixUserId
   */
  public async getClientExtensionByBitrixUserId(
    clientId: number,
    bitrixUserId: string,
  ): Promise<TelphinExtensionItem | null> {
    const extensionFromCache =
      await this.redisService.get<TelphinExtensionItem>(
        REDIS_KEYS.TELPHIN_EXTENSION_ITEM_BY_BITRIX_ID + bitrixUserId,
      );

    if (extensionFromCache) return extensionFromCache;

    const extensions = await this.getClientExtensionList(clientId);

    if (!extensions) return null;

    const targetExtension = extensions.find(({ extra_params }) => {
      try {
        const { comment } = JSON.parse(
          extra_params,
        ) as TelphinExtensionItemExtraParams;

        return comment === bitrixUserId;
      } catch (e) {
        return false;
      }
    });

    if (!targetExtension) return null;

    this.redisService.set<TelphinExtensionItem>(
      REDIS_KEYS.TELPHIN_EXTENSION_ITEM_BY_BITRIX_ID + bitrixUserId,
      targetExtension,
      300, // 5 minutes
    );

    return targetExtension;
  }

  /**
   * Get external phone list
   *
   * ---
   *
   * Получить список внешних номеров
   *
   * @param clientId
   * @param action
   */
  public async getExternalPhoneList(
    clientId: number,
    action: 'force' | 'cache' = 'cache',
  ): Promise<TelphinExternalPhone[]> {
    try {
      if (action === 'cache') {
        const phoneListFromCache = await this.redisService.get<
          TelphinExternalPhone[]
        >(REDIS_KEYS.TELPHIN_EXTERNAL_PHONE_LIST);

        if (phoneListFromCache) return phoneListFromCache;
      }

      const phoneList = await this.telphinApiService.get<
        TelphinExternalPhone[]
      >(`/client/${clientId}/did`);

      if (!phoneList) return [];

      this.redisService.set<TelphinExternalPhone[]>(
        REDIS_KEYS.TELPHIN_EXTERNAL_PHONE_LIST,
        phoneList,
        900, // 15 minutes
      );

      return phoneList;
    } catch (error) {
      this.logger.error(error.toString(), '', true);
      return [];
    }
  }

  /**
   * Get external phone by specific field
   *
   * ---
   *
   * Получить внешний номер по определенному полю
   * @param clientId
   * @param fieldName
   * @param fieldValue
   */
  public async getExternalPhoneByField(
    clientId: number,
    fieldName: keyof TelphinExternalPhone,
    fieldValue: string,
  ): Promise<TelphinExternalPhone | null> {
    const phoneList = await this.getExternalPhoneList(clientId);

    if (phoneList.length === 0) return null;

    const targetPhone = phoneList.find((p) => p[fieldName] == fieldValue);

    return targetPhone ? targetPhone : null;
  }

  /**
   * Get extension phone by ID
   *
   * ---
   *
   * Получить внутренний номер по ID
   * @param extensionId
   */
  public async getInternalPhoneByExtensionId(extensionId: number) {
    return this.telphinApiService.get<TelphinInternalPhone | null>(
      `/extension/${extensionId}/ani/`,
    );
  }

  public async getInternalPhoneList(clientId: number) {
    return this.telphinApiService.get(`/client/${clientId}/did`);
  }
}
