import { Injectable, NotFoundException } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import {
  B24CreateDeal,
  B24Deal,
  B24DealField,
  B24DealFields,
  B24DealListParams,
  B24DealUserField,
  B24UpdateDeal,
} from './interfaces/deal.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { B24ActionType } from '@/modules/bitrix/interfaces/bitrix.interface';

@Injectable()
export class BitrixDealService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Getting deal by deal id
   *
   * ---
   *
   * Получение сделки по ID
   *
   * @param dealId
   * @param action
   */
  async getDealById(dealId: number | string, action: B24ActionType = 'cache') {
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

    if (!deal) throw new NotFoundException('deal not found');

    this.redisService.set<B24Deal>(
      REDIS_KEYS.BITRIX_DATA_DEAL_ITEM + dealId,
      deal,
      3600,
    );

    return deal;
  }

  async getDeal(fields: B24DealListParams) {
    return this.bitrixService.callMethod<B24DealListParams, B24Deal[]>(
      'crm.deal.list',
      fields,
    );
  }

  async createDeal(fields: Partial<B24Deal>, options?: object) {
    return this.bitrixService.callMethod<B24CreateDeal, number>(
      'crm.deal.add',
      {
        fields: fields,
        options: options,
      },
    );
  }

  async getDealFields() {
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
  }

  async getDealField(fieldId: string) {
    const dealFieldFromCache = await this.redisService.get<
      B24DealField & B24DealUserField
    >(REDIS_KEYS.BITRIX_DATA_DEAL_FIELD + fieldId);

    if (dealFieldFromCache) return dealFieldFromCache;

    const dealFields = await this.getDealFields();

    if (!(fieldId in dealFields))
      throw new NotFoundException('Field not found');

    await this.redisService.set<B24DealField & B24DealUserField>(
      REDIS_KEYS.BITRIX_DATA_DEAL_FIELD + fieldId,
      dealFields[fieldId],
      86400,
    );

    return dealFields[fieldId];
  }

  async getDealStageHistory() {
    return this.bitrixService.callMethod('crm.stagehistory.list');
  }

  async updateDeal(dealId: string, fields: Partial<B24Deal>) {
    return this.bitrixService.callMethod<B24UpdateDeal>('crm.deal.update', {
      id: dealId,
      fields: fields,
    });
  }
}
