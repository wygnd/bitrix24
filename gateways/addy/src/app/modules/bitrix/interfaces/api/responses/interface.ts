import { IB24Timestamp } from '../interface';

export interface IB24Response<T> {
  result: T;
  total: number;
  time: IB24Timestamp;
}
