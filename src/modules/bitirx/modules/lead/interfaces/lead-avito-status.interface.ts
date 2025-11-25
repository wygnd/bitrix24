import { B24LeadStatus } from '@/modules/bitirx/modules/lead/interfaces/lead.interface';

export interface LeadAvitoStatus {
  avito_number: string;
  avito_name: string;
  date_cerate: string;
  date_last_request: string;
  status: B24LeadStatus;
}
