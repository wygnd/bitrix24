import { B24LeadStatus } from '@/modules/bitrix/application/interfaces/leads/lead.interface';

export interface WikiLeadResultRequestClientFromAvito {
  wiki_lead_id: number;
  lead_id: number;
  status: B24LeadStatus;
}
