import { B24ListOrder } from './bitrix.interface';
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

export interface B24ErrorResponse {
  error: string;
  error_description: string;
}

export type B24Response<T> = B24SuccessResponse<T> | B24ErrorResponse;
