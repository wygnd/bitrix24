import { B24Lead } from '@/modules/bitrix/modules/lead/interfaces/lead.interface';

export interface B24LeadUpdateFields {
  id: string;
  fields: Partial<B24Lead & Record<string, any>>;
}
