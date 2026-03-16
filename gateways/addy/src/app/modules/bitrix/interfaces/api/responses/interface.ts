import { IB24Timestamp, TB24ErrorType } from '../interface';

export interface IB24Response<T> {
  result: T;
  total: number;
  time: IB24Timestamp;
}

interface IB24ErrorResponse {
  error: TB24ErrorType;
  error_description: string;
}

export interface IB24BatchResponseMap<
  T extends Record<string, any> = Record<string, any>,
> {
  result: {
    result: {
      [K in keyof T]: T[K];
    };
    result_error: Record<string, IB24ErrorResponse>;
    result_total: Record<string, number>;
    result_next: Record<string, number>;
    result_time: Record<string, IB24Timestamp>;
  };
  time: IB24Timestamp;
}