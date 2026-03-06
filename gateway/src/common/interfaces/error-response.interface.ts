export interface ErrorResponseOptions<T = string> {
  message?: T;
  error: string;
  statusCode: number;
}
