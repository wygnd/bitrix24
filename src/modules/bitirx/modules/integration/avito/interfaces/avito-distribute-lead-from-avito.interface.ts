import { B24LeadStatus } from '@/modules/bitirx/modules/lead/interfaces/lead.interface';

export interface IntegrationAvitoDistributeLeadFromAvito {
  lead_id: string;
  status: B24LeadStatus;
}

export interface IntegrationAvitoDistributeLeadFromAvitoServiceOptions {
  name: string;
  value: string;
}
