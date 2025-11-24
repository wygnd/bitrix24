export enum QueueProcessorStatus {
  OK = 'ok',
  INVALID = 'invalid',
}

export interface QueueProcessorResponse<T = any> {
  message: string;
  status: QueueProcessorStatus;
  data: T;
}
