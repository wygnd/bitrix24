export interface B24Lead extends Record<string, string> {
  ID: string;
  ASSIGNED_BY_ID: string;
  STATUS_ID: string;
  DATE_CREATE: string;
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