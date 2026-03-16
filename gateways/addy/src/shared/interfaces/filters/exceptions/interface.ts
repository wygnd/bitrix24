export interface IResolveException {
  statusCode: number;
  message: string | object;
  stack?: string;
}
