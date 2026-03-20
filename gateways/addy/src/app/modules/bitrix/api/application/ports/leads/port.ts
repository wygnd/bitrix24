import { IB24Lead } from '../../interfaces/leads/interface';
import { IB24LeadUpdateOptions } from '../../interfaces/leads/update/interface';
import { IB24ListParams } from '../../../../interfaces/api/interface';
import { TB24LeadDuplicateType } from '../../interfaces/leads/duplicates/interface';

export interface IB24LeadsPort {
  getLeadById(
    leadId: string,
    originalUfNames?: boolean,
  ): Promise<IB24Lead | null>;
  getDuplicateLeads(
    entity: TB24LeadDuplicateType,
    phone: string | string[],
  ): Promise<number[]>;
  createLead(fields: Partial<IB24Lead>): Promise<IB24Lead | null>;
  updateLead(fields: IB24LeadUpdateOptions): Promise<boolean>;
  getLeads(fields?: IB24ListParams<IB24Lead>): Promise<IB24Lead[]>;
}
