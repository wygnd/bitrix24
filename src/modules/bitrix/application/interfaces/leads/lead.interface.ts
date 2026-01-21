import { B24CRMMultifield } from '@/modules/bitrix/interfaces/bitrix-types.interface';

export type B24Lead = B24LeadDefault & Record<string, any>;

export interface B24LeadDefault {
  ID: string;
  ASSIGNED_BY_ID: string;
  STATUS_ID: string;
  DATE_CREATE: string;
  PHONE: Omit<B24CRMMultifield, 'ID' | 'TYPE_ID'>[];
  COMMENTS?: string;
  MOVED_TIME: string;
}

export interface B24DuplicateFindByComm {
  type: 'EMAIL' | 'PHONE';
  values: string[];
  entity_type: 'LEAD' | 'CONTACT' | 'COMPANY';
}

export type B24DuplicateFindByCommResponse = { [key: string]: number[] };

export enum B24LeadStatus {
  NEW = 'new',
  NONACTIVE = 'nonactive',
  ACTIVE = 'active',
  LOST = 'lost',
  FINISH = 'finish',
  UNKNOWN = 'unknown',
}
