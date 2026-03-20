import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IB24LeadsPort } from '../../../application/ports/leads/port';
import { B24PORTS } from '../../../../constants/ports/constant';
import type { IB24Port } from '../../../application/ports/port';
import { IB24Lead } from '../../../application/interfaces/leads/interface';
import { IB24ListParams } from '../../../../interfaces/api/interface';
import { IB24LeadUpdateOptions } from '../../../application/interfaces/leads/update/interface';
import { TB24LeadDuplicateType } from '../../../application/interfaces/leads/duplicates/interface';
import { WinstonLogger } from '@shared/logger/winston.logger';
import { maybeCatchError } from '@shared/utils/catch-error';

@Injectable()
export class B24LeadsAdapter implements IB24LeadsPort {
  private readonly logger = new WinstonLogger(
    B24LeadsAdapter.name,
    'bitrix/leads',
  );

  constructor(
    @Inject(B24PORTS.BITRIX_DEFAULT)
    private readonly bitrixService: IB24Port,
  ) {}

  createLead(fields: Partial<IB24Lead>): Promise<number> {
    return Promise.resolve(0);
  }

  /**
   * Find duplicate leads by phone or email
   *
   * ---
   *
   * Поиск дублей лидов по номеру телефона или электронной почте
   * @param type
   * @param fields
   */
  public async getDuplicateLeads(
    type: TB24LeadDuplicateType,
    fields: string | string[],
  ): Promise<number[]> {
    try {
      const { result } = await this.bitrixService.callMethod<
        object,
        { LEAD: number[] } | []
      >('crm.duplicate.findbycomm', {
        type: type.toUpperCase(),
        values: Array.isArray(fields) ? fields : [fields],
        entity_type: 'LEAD',
      });

      if (Array.isArray(result)) return [];

      return result.LEAD;
    } catch (error) {
      this.logger.error({
        handler: this.getDuplicateLeads.name,
        fields: {
          type,
          fields,
        },
        error: maybeCatchError(error),
      });
      throw error;
    }
  }

  public async getLeadById(
    leadId: string,
    originalUfNames = false,
  ): Promise<IB24Lead | null> {
    try {
      const { result } = await this.bitrixService.callMethod<
        object,
        { item: IB24Lead }
      >('crm.item.get', {
        entityTypeId: '1',
        id: leadId,
        useOriginalUfNames: originalUfNames ? 'Y' : 'N',
      });

      if (!result || !('item' in result) || !result.item)
        throw new NotFoundException('Лид не найден');

      return result.item;
    } catch (error) {
      this.logger.error({
        handler: this.getLeadById.name,
        fields: {
          leadId,
          originalUfNames,
        },
        error: maybeCatchError(error),
      });
      throw error;
    }
  }

  getLeads(fields?: IB24ListParams<IB24Lead>): Promise<IB24Lead[]> {
    return Promise.resolve([]);
  }

  updateLead(fields: IB24LeadUpdateOptions): Promise<boolean> {
    return Promise.resolve(false);
  }
}
