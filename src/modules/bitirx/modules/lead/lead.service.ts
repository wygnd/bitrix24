import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import {
  B24DuplicateFindByComm,
  B24DuplicateFindByCommResponse,
  B24Lead,
} from './lead.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';

@Injectable()
export class BitrixLeadService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
  ) {}

  async getLeadById(id: string) {
    return await this.bitrixService.callMethod<Partial<B24Lead>, B24Lead>(
      'crm.lead.get',
      {
        ID: id,
      },
    );
  }

  async getDuplicateLeadsByPhone(phone: string, force: boolean = false) {
    if (!force) {
      const duplicatesFromCache = await this.redisService.get<number[]>(
        REDIS_KEYS.BITRIX_DATA_LEAD_DUPLICATE_BY_PHONE + phone,
      );

      if (duplicatesFromCache) return duplicatesFromCache;
    }

    const { result: response } = await this.bitrixService.callMethod<
      B24DuplicateFindByComm,
      B24DuplicateFindByCommResponse
    >('crm.duplicate.findbycomm', {
      type: 'PHONE',
      values: [phone],
      entity_type: 'LEAD',
    });

    const result =
      Array.isArray(response) || !response
        ? []
        : 'LEAD' in response
          ? response.LEAD
          : [];

    this.redisService.set<number[]>(
      REDIS_KEYS.BITRIX_DATA_LEAD_DUPLICATE_BY_PHONE + phone,
      result,
      600, // 10 минут
    );

    return result;
  }

  async createLead(fields: Partial<B24Lead>) {
    return this.bitrixService.callMethod<Partial<B24Lead>, number>(
      'crm.lead.add',
      fields,
    );
  }
}
