import { Injectable, NotFoundException } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import {
  B24CreateDeal,
  B24Deal,
  B24DealField,
  B24DealFields,
  B24DealListParams,
  B24DealUserField,
} from './deal.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';

@Injectable()
export class BitrixDealService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
  ) {}

  async getDealById(dealId: number | string) {
    return this.bitrixService.callMethod<{ id: string | number }, B24Deal>(
      'crm.deal.get',
      {
        id: dealId,
      },
    );
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

    await this.redisService.set<B24DealFields>(
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
}
