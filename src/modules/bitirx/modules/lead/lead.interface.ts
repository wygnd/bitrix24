export interface B24Lead {
  ID: string;
}

export interface B24DuplicateFindByComm {
  type: 'EMAIL' | 'PHONE';
  values: string[];
  entity_type: 'LEAD' | 'CONTACT' | 'COMPANY';
}

export type B24DuplicateFindByCommResponse = { [key: string]: number[] };
