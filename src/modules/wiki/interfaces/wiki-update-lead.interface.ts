import { B24LeadStatus } from '@/modules/bitrix/application/interfaces/leads/lead.interface';

export interface WikiUpdateLeadRequest {
  wiki_lead_id: number;
  lead_id: number;
  status: B24LeadStatus;
}

export interface WikIUpdateLeadResponse {
  message: string;
  lead_id: number;
  wiki_lead_id: number;
}
