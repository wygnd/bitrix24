export interface QueueAddTaskResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
}
