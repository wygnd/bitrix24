import { B24AuthOptions } from '@/modules/bitirx/interfaces/bitrix.interface';

export interface B24EventAdd {
  event: string;
  handler: string;
  auth_type?: number;
  event_type?: string;
  auth_connector?: string;
  options?: string;
}

export type B24EventList =
  | 'ONIMCOMMANDADD'
  | 'ONAPPINSTALL'
  | 'ONCRMDEALUPDATE'
  | 'ONTASKUPDATE';

export interface B24EventTaskUpdateData {
  FIELDS_BEFORE: any;
  FIELDS_AFTER: any;
  IS_ACCESSIBLE_BEFORE: any;
  IS_ACCESSIBLE_AFTER: any;
}

export interface B24EventBody<T = any> {
  event: B24EventList;
  event_handler_id: number;
  data: T;
  ts: number;
  auth: B24AuthOptions;
}