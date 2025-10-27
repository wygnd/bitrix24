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
  HEAD_HUNTER = 'Head Hunter',
}

interface B24Timestamp {
  start: number;
  finish: number;
  duration: number;
  processing: number;
  date_start: string;
  date_finish: string;
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
  | 'invalid_scope'
  | 'INTERNAL_SERVER_ERROR'
  | 'ERROR_UNEXPECTED_ANSWER'
  | 'QUERY_LIMIT_EXCEEDED'
  | 'ERROR_BATCH_METHOD_NOT_ALLOWED'
  | 'ERROR_BATCH_LENGTH_EXCEEDED'
  | 'NO_AUTH_FOUND'
  | 'INVALID_REQUEST'
  | 'OVERLOAD_LIMIT'
  | 'ACCESS_DENIED'
  | 'INVALID_CREDENTIALS'
  | 'ERROR_MANIFEST_IS_NOT_AVAILABLE'
  | 'expired_token'
  | 'user_access_error';

export interface B24ErrorResponse {
  error: B24ErrorType;
  error_description: string;
}

export type B24Response<T> = B24SuccessResponse<T> | B24ErrorResponse;

export interface B24BatchResponseMap<
  T extends Record<string, any> = Record<string, any>,
> {
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
