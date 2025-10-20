import { ISODate } from '@bitrix24/b24jssdk';

export enum B24ApiTags {
  LEADS = 'Leads',
  USERS = 'Users',
  IMBOT = 'Imbot',
  IM = 'Messages',
  PLACEMENT = 'Placement',
  DEAPRTMENTS = 'Departments',
  TEST = 'Test',
  EVENTS = 'Events',
  AVITO = 'Avito',
}

interface B24Timestamp {
  start: number;
  finish: number;
  duration: number;
  processing: number;
  date_start: ISODate;
  date_finish: ISODate;
  operating_reset_at: number;
  operating: number;
}

export interface B24SuccessResponse<T> {
  result?: T;
  total?: number;
  time: B24Timestamp;
}

export type B24ErrorType =
  | 'invalid_client'
  | 'invalid_request'
  | 'insufficient_scope'
  | 'invalid_grant'
  | 'invalid_scope';

export interface B24ErrorResponse {
  error: B24ErrorType;
  error_description: string;
}

export type B24Response<T> = B24SuccessResponse<T> | B24ErrorResponse;

export interface B24BatchResponseMap<T extends Record<string, any>> {
  result: {
    result: {
      [K in keyof T]: T[K];
    };
    result_error: Record<string, B24ErrorResponse>;
    result_total: Record<string, number>;
    result_next: Record<string, number>;
    result_time: Record<string, B24Timestamp>;
  };
  time: B24Timestamp;
}
