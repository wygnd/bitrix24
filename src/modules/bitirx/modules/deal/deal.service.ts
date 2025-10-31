import { Injectable, NotFoundException } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import {
  B24CreateDeal,
  B24Deal,
  B24DealFields,
  B24DealListParams,
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
    const dealFields = await this.getDealFields();

    const findFields = Object.keys(dealFields).filter(
      (fieldKey) => fieldKey === fieldId,
    );

    if (findFields.length === 0) throw new NotFoundException('Field not found');

    return dealFields[findFields[0]];
  }
}
