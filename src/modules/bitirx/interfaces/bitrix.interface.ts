import { ISODate } from '@bitrix24/b24jssdk';

type B24AvailableMethods =
  | 'user.get'
  | 'crm.lead.get'
  | 'crm.lead.list'
  | 'crm.lead.update'
  | 'crm.lead.add'
  | 'tasks.task.list'
  | 'department.get'
  | 'tasks.task.delete'
  | 'crm.deal.list'
  | 'crm.deal.add'
  | 'crm.deal.get'
  | 'im.message.add';

export type B24ListOrder = 'ASC' | 'DESC';

interface B24Timestamp {
  start: number;
  finish: number;
  duration: number;
  processing: number;
  date_start: ISODate;
  date_finish: ISODate;
  operating_reset_at: number;
  operating: number;
}

export interface B24SuccessResponse<T> {
  result?: T;
  total?: number;
  time: B24Timestamp;
}

export interface B24ErrorResponse {
  error: string;
  error_description: string;
}

export type B24Response<T> = B24SuccessResponse<T>;

export interface B24ListParams<
  TFilter extends Record<string, any> = Record<string, any>,
  TOrder extends Record<string, B24ListOrder> = Record<string, B24ListOrder>,
  TSelect extends Array<string> = Array<string>,
> {
  filter?: TFilter;
  order?: TOrder;
  select?: TSelect;
  start?: number;
}

export type B24FilterOperators =
  | ''
  | '!'
  | '@'
  | '!@'
  | '%'
  | '%='
  | '=%'
  | '!%'
  | '!=%'
  | '>'
  | '<';

export type B24FilterOptions<T> = {
  [K in keyof T as `${B24FilterOperators}${Extract<K, string>}`]?: T[K];
};

export type B24SelectOptions<T> = (keyof T)[];

interface B24BatchCommand {
  method: B24AvailableMethods;
  params: {};
}

export type B24BatchCommands = {
  [key: string]: B24BatchCommand;
};

//todo type batch response
export type B24BatchResponse<T> = {
  [key: string]: B24SuccessResponse<T>;
};
