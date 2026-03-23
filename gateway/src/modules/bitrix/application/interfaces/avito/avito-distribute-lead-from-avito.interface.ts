import { B24LeadStatus } from '@/modules/bitrix/application/interfaces/leads/lead.interface';

export interface IntegrationAvitoDistributeLeadFromAvito {
  wiki_lead_id: number;
  lead_id: number;
  status: B24LeadStatus;
}

export interface IntegrationAvitoDistributeLeadFromAvitoServiceOptions {
  name: string;
  value: string;
}
