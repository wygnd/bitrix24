import {
  B24ActionType,
  B24ListParams,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24Lead } from '@/modules/bitrix/application/interfaces/leads/lead.interface';
import { B24LeadUpdateFields } from '@/modules/bitrix/application/interfaces/leads/lead-update.interface';

export interface BitrixLeadsPort {
  getLeadById(leadId: string): Promise<B24Lead | null>;
  getDuplicateLeadsByPhone(
    phone: string | string[],
    action?: B24ActionType,
  ): Promise<number[]>;
  createLead(fields: Partial<B24Lead>): Promise<number>;
  updateLead(fields: B24LeadUpdateFields): Promise<boolean>;
  getLeads(fields?: B24ListParams<B24Lead>): Promise<B24Lead[]>;
}
