import { IB24CRMMultiField } from '../../../../interfaces/api/interface';

export type IB24Lead = IB24LeadDefault & Record<string, any>;

export interface IB24LeadDefault {
  ID: string;
  ASSIGNED_BY_ID: string;
  STATUS_ID: string;
  DATE_CREATE: string;
  PHONE: Omit<IB24CRMMultiField, 'ID' | 'TYPE_ID'>[];
  COMMENTS?: string;
  MOVED_TIME: string;
}
