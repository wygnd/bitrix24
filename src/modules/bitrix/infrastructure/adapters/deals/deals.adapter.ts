import { BitrixDealsPort } from '@/modules/bitrix/application/ports/deals/deals.port';
import { B24ActionType } from '@/modules/bitrix/interfaces/bitrix.interface';
import {
  B24CreateDeal,
  B24Deal,
  B24DealField,
  B24DealFields,
  B24DealListParams,
  B24DealUserField,
  B24UpdateDeal,
} from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '@/modules/redis/redis.service';
import { WinstonLogger } from '@/config/winston.logger';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

@Injectable()
export class BitrixDealsAdapter implements BitrixDealsPort {
  private readonly logger = new WinstonLogger(
    BitrixDealsAdapter.name,
    'bitrix:deals'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get deals by deal_id
   *
   * ---
   *
   * Получить сделку по ID
   * @param dealId
   * @param action
   */
  async getDealById(dealId: number | string, action: B24ActionType = 'cache') {
    try {
      if (action === 'cache') {
        const dealFromCache = await this.redisService.get<B24Deal>(
          REDIS_KEYS.BITRIX_DATA_DEAL_ITEM + dealId,
        );

        if (dealFromCache) return dealFromCache;
      }

      const { result: deal } = await this.bitrixService.callMethod<
        { id: string | number },
        B24Deal
      >('crm.deal.get', {
        id: dealId,
      });

      if (!deal) return null;

      this.redisService.set<B24Deal>(
        REDIS_KEYS.BITRIX_DATA_DEAL_ITEM + dealId,
        deal,
        300, // 5 minute
      );

      return deal;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Get deals list
   *
   * ---
   *
   * Получает список сделок
   * @param fields
   */
  async getDeals(fields?: B24DealListParams) {
    try {
      const response = await this.bitrixService.callMethod<
        B24DealListParams,
        B24Deal[]
      >('crm.deal.list', fields);

      return response.result ? response.result : [];
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  /**
   * Create deals
   *
   * ---
   *
   * Создает сделку
   * @param fields
   * @param options
   */
  async createDeal(fields: Partial<B24Deal>, options?: object) {
    try {
      const response = await this.bitrixService.callMethod<
        B24CreateDeal,
        number
      >('crm.deal.add', {
        fields: fields,
        options: options,
      });

      return response.result ? response.result : 0;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }

  /**
   * Get deals fields description
   *
   * ---
   *
   * Получить поля сделки
   */
  async getDealFields() {
    try {
      const dealFieldsFromCache = await this.redisService.get<B24DealFields>(
        REDIS_KEYS.BITRIX_DATA_DEAL_FIELDS,
      );

      if (dealFieldsFromCache) return dealFieldsFromCache;

      const { result: dealFields } = await this.bitrixService.callMethod<
        object,
        B24DealFields
      >('crm.deal.fields');

      if (!dealFields) throw new NotFoundException('Deal fields in not found');

      this.redisService.set<B24DealFields>(
        REDIS_KEYS.BITRIX_DATA_DEAL_FIELDS,
        dealFields,
        3600,
      );

      return dealFields;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Get specific deals field
   *
   * ---
   *
   * Получить конкретное поле сделки
   * @param fieldId
   */
  async getDealField(fieldId: string) {
    try {
      const dealFieldFromCache = await this.redisService.get<
        B24DealField & B24DealUserField
      >(REDIS_KEYS.BITRIX_DATA_DEAL_FIELD + fieldId);

      if (dealFieldFromCache) return dealFieldFromCache;

      const dealFields = await this.getDealFields();

      if (!dealFields || !(fieldId in dealFields))
        throw new NotFoundException('Field not found');

      await this.redisService.set<B24DealField & B24DealUserField>(
        REDIS_KEYS.BITRIX_DATA_DEAL_FIELD + fieldId,
        dealFields[fieldId],
        86400,
      );

      return dealFields[fieldId];
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Update deal by deal_id and specific fields
   *
   * ---
   *
   * Обновляет сделку
   * @param dealId
   * @param fields
   */
  async updateDeal(dealId: string, fields: Partial<B24Deal>) {
    try {
      const response = await this.bitrixService.callMethod<
        B24UpdateDeal,
        boolean
      >('crm.deal.update', {
        id: dealId,
        fields: fields,
      });

      return response.result ? response.result : false;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
