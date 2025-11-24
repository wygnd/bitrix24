export enum QueueProcessorStatus {
  OK = 'ok',
  INVALID = 'invalid',
  NOT_HANDLED = 'not handled',
}

export interface QueueProcessorResponse<T = any> {
  message: string;
  status: QueueProcessorStatus;
  data: T;
}
