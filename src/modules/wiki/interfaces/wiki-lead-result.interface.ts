import { B24LeadStatus } from '@/modules/bitrix/modules/lead/interfaces/lead.interface';

export interface WikiLeadResultRequestClientFromAvito {
  wiki_lead_id: number;
  lead_id: number;
  status: B24LeadStatus;
}
