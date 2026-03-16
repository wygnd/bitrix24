import { Inject, Injectable } from '@nestjs/common';
import { IB24LeadsPort } from '../../../application/ports/leads/port';
import { B24PORTS } from '../../../constants/ports/constant';
import type { IB24Port } from '../../../application/ports/port';
import { IB24Lead } from '../../../application/interfaces/leads/interface';
import { IB24ListParams } from '../../../../interfaces/api/interface';
import { IB24LeadUpdateOptions } from '../../../application/interfaces/leads/update/interface';
import { TB24LeadDuplicateType } from '../../../application/interfaces/leads/duplicates/interface';

@Injectable()
export class B24LeadsAdapter implements IB24LeadsPort {
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
  }

  getLeadById(leadId: string): Promise<IB24Lead | null> {
    return Promise.resolve(null);
  }

  getLeads(fields?: IB24ListParams<IB24Lead>): Promise<IB24Lead[]> {
    return Promise.resolve([]);
  }

  updateLead(fields: IB24LeadUpdateOptions): Promise<boolean> {
    return Promise.resolve(false);
  }
}
