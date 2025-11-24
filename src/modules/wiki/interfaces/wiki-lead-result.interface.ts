import { B24LeadStatus } from '@/modules/bitirx/modules/lead/interfaces/lead.interface';

export interface WikiLeadResultRequestClientFromAvito {
  wiki_lead_id: string;
  lead_id: string;
  status: B24LeadStatus;
}
