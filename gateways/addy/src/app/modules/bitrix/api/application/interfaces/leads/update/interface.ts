import { IB24Lead } from '../interface';

export interface IB24LeadUpdateOptions {
  id: string;
  fields: Partial<IB24Lead & Record<string, any>>;
}
