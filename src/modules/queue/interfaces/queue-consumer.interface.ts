export enum QueueConsumerStatus {
  OK = 'ok',
  INVALID = 'invalid',
}

export interface QueueConsumerResponse<T = any> {
  message: string;
  status: QueueConsumerStatus;
  data: T;
}
