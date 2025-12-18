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
import { TelphinExtensionGroup } from '@/modules/telphin/interfaces/telphin-extension-group.interface';

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
   */
  public async getCurrentCalls() {
    const callList =
      await this.telphinApiService.get<TelphinGetCallListResponse>(
        `/client/${this.CLIENT_ID}/current_calls/`,
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
   */
  public async getClientExtensionList(): Promise<TelphinExtensionItem[]> {
    const extensionsFromCache = await this.redisService.get<
      TelphinExtensionItem[]
    >(REDIS_KEYS.TELPHIN_EXTENSION_LIST);

    if (extensionsFromCache) return extensionsFromCache;

    const extensions = await this.telphinApiService.get<TelphinExtensionItem[]>(
      `/client/${this.CLIENT_ID}/extension/`,
    );

    if (!extensions) return [];

    this.redisService.set<TelphinExtensionItem[]>(
      REDIS_KEYS.TELPHIN_EXTENSION_LIST,
      extensions,
      900, // 15 minutes
    );

    return extensions;
  }

  public async getClientExtensionById(extensionId: number) {
    const extensionFromCache =
      await this.redisService.get<TelphinExtensionItem>(
        REDIS_KEYS.TELPHIN_EXTENSION_ITEM + extensionId,
      );

    if (extensionFromCache) return extensionFromCache;

    const extension = await this.telphinApiService.get<TelphinExtensionItem>(
      `/client/${this.CLIENT_ID}/extension/${extensionId}`,
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

    const extensions = await this.getClientExtensionList();

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
   * @param action
   */
  public async getExternalPhoneList(
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
      >(`/client/${this.CLIENT_ID}/did`);

      if (!phoneList) return [];

      this.redisService.set<TelphinExternalPhone[]>(
        REDIS_KEYS.TELPHIN_EXTERNAL_PHONE_LIST,
        phoneList,
        900, // 15 minutes
      );

      return phoneList;
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  /**
   * Get external phone by specific field
   *
   * ---
   *
   * Получить внешний номер по определенному полю
   * @param fieldName
   * @param fieldValue
   */
  public async getExternalPhoneByField(
    fieldName: keyof TelphinExternalPhone,
    fieldValue: string,
  ): Promise<TelphinExternalPhone | null> {
    const phoneList = await this.getExternalPhoneList();

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

  /**
   * Get extension group list from telphin
   *
   * ---
   *
   * Получить список групп внутренних номеров
   * @param action
   */
  public async getExtensionGroupList(action: 'force' | 'cache' = 'cache') {
    if (action === 'cache') {
      const groupListFromCache = await this.redisService.get<
        TelphinExtensionGroup[]
      >(REDIS_KEYS.TELPHIN_EXTENSION_GROUP_LIST);

      if (groupListFromCache) return groupListFromCache;
    }

    const groupList = await this.telphinApiService.get<TelphinExtensionGroup[]>(
      `/client/${this.CLIENT_ID}/extension_group/`,
    );

    if (!groupList) return [];

    this.redisService.set<TelphinExtensionGroup[]>(
      REDIS_KEYS.TELPHIN_EXTERNAL_PHONE_LIST,
      groupList,
      900, // 15 minutes
    );

    return groupList;
  }

  /**
   * Get extension group by id
   *
   * ---
   *
   * Получить группу внутренних номеров по ID
   * @param extensionGroupId
   */
  public async getExtensionGroupById(
    extensionGroupId: number,
  ): Promise<TelphinExtensionGroup | null> {
    return (
      (await this.getExtensionGroupList()).find(
        (extGrp) => extGrp.id === extensionGroupId,
      ) ?? null
    );
  }

  /**
   * Get extension group list and filtered this list by specific field and return selected fields on each item.
   * If [selectFields] is undefined will be returned full object
   *
   * ---
   *
   * Получает список групп внутренних номеров, фильтрует этот список по заданному значению и возвращает определенный поля,
   * если они были переданы. Если поля не переданы, будет возвращен весь объект
   * @param filterFieldName
   * @param filterFieldValue
   */
  public async getFilteredExtensionsByGroupField(
    filterFieldName: keyof TelphinExtensionGroup,
    filterFieldValue: string,
  ) {
    // todo: add select fields
    return (await this.getExtensionGroupList()).filter((extensionGroup) =>
      RegExp(filterFieldValue, 'gi').test(`${extensionGroup[filterFieldName]}`),
    );
  }

  public async getExtensionGroupExtensionListByGroupIds(
    extensionGroupIds: number[],
  ) {
    return Promise.all(
      extensionGroupIds.map((extensionGroupId) =>
        this.telphinApiService.get<TelphinExtensionItem[]>(
          `/extension_group/${extensionGroupId}/extension/`,
        ),
      ),
    ).then((responses) => {
      const responseArray: TelphinExtensionItem[] = [];

      responses.forEach((res) => {
        if (!res) return;

        responseArray.push(...res);
      });

      return responseArray;
    });
  }

  get CLIENT_ID() {
    return this.telphinApiService.TELPHIN_APPLICATION_INFO.client_id;
  }
}
