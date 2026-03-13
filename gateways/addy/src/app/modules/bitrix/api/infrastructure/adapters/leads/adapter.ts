import { Inject, Injectable } from '@nestjs/common';
import { IB24LeadsPort } from '../../../application/ports/leads/port';
import { B24PORTS } from '../../../constants/ports/constant';
import type { IB24Port } from '../../../application/ports/port';
import { IB24Lead } from '../../../application/interfaces/leads/interface';
import { IB24ListParams } from '../../../../interfaces/api/interface';
import { IB24LeadUpdateOptions } from '../../../application/interfaces/leads/update/interface';

@Injectable()
export class B24LeadsAdapter implements IB24LeadsPort {
  constructor(
    @Inject(B24PORTS.BITRIX_DEFAULT)
    private readonly bitrixService: IB24Port,
  ) {}

  createLead(fields: Partial<IB24Lead>): Promise<number> {
    return Promise.resolve(0);
  }

  getDuplicateLeadsByPhone(phone: string | string[]): Promise<number[]> {
    return Promise.resolve([]);
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
