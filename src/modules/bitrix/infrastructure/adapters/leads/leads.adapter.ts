import { Inject, Injectable } from '@nestjs/common';
import { BitrixLeadsPort } from '@/modules/bitrix/application/ports/leads/leads.port';
import { RedisService } from '@/modules/redis/redis.service';
import {
  B24DuplicateFindByComm,
  B24DuplicateFindByCommResponse,
  B24Lead,
} from '@/modules/bitrix/application/interfaces/leads/lead.interface';
import {
  B24ActionType,
  B24ListParams,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24LeadUpdateFields } from '@/modules/bitrix/application/interfaces/leads/lead-update.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

@Injectable()
export class BitrixLeadsAdapter implements BitrixLeadsPort {
  private readonly logger = new WinstonLogger(
    BitrixLeadsAdapter.name,
    'bitrix:leads'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Fetch lead from bitrix by ID
   *
   * ---
   *
   * Получение лида из битрикс по ID
   *
   * @param id
   */
  public async getLeadById(id: string) {
    try {
      const response = await this.bitrixService.callMethod<
        Partial<B24Lead>,
        B24Lead
      >('crm.lead.get', {
        ID: id,
      });

      return response?.result ?? null;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Find duplicate leads by phone numbers
   *
   * ---
   *
   * Поиск дубликатов лидов по номеру/номерам телефонов
   * @param phone
   * @param action
   */
  public async getDuplicateLeadsByPhone(
    phone: string | string[],
    action: B24ActionType = 'cache',
  ) {
    if (action == 'cache') {
      const duplicatesFromCache = await this.redisService.get<number[]>(
        REDIS_KEYS.BITRIX_DATA_LEAD_DUPLICATE_BY_PHONE + phone,
      );

      if (duplicatesFromCache && duplicatesFromCache.length !== 0)
        return duplicatesFromCache;
    }

    const phoneValues = Array.isArray(phone) ? phone : [phone];
    const { result: response } = await this.bitrixService.callMethod<
      B24DuplicateFindByComm,
      B24DuplicateFindByCommResponse
    >('crm.duplicate.findbycomm', {
      type: 'PHONE',
      values: phoneValues,
      entity_type: 'LEAD',
    });

    const result =
      Array.isArray(response) || !response
        ? []
        : 'LEAD' in response
          ? response.LEAD
          : [];

    if (result.length !== 0) {
      this.redisService.set<number[]>(
        REDIS_KEYS.BITRIX_DATA_LEAD_DUPLICATE_BY_PHONE + phone,
        result,
        300, // 5 минут
      );
    }

    return result;
  }

  /**
   *  Crete lead in bitrix
   *
   *  ---
   *
   *  Создание лида
   * @param fields
   */
  public async createLead(fields: Partial<B24Lead>) {
    try {
      const response = await this.bitrixService.callMethod<
        Partial<B24Lead>,
        number
      >('crm.lead.add', {
        fields: fields,
      });
      return response?.result ?? 0;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }

  /**
   * Get lead list by special parameters
   *
   * ---
   *
   * Получить список лидов по определенным параметрам
   *
   * @param fields
   */
  public async getLeads(fields?: B24ListParams<B24Lead>) {
    try {
      const response = await this.bitrixService.callMethod<
        B24ListParams<B24Lead>,
        B24Lead[]
      >('crm.deal.list', fields);

      return response?.result ?? [];
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  /**
   * Update lead
   *
   * ---
   *
   * Обновление лида
   *
   * @param fields
   */
  public async updateLead(fields: B24LeadUpdateFields) {
    try {
      const response = await this.bitrixService.callMethod<
        B24LeadUpdateFields,
        boolean
      >('crm.lead.update', fields);

      return response?.result ?? false;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
