export type B24AvailableMethods =
  | 'user.current'
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
  | 'im.message.add'
  | 'imbot.command.register'
  | 'im.message.delete'
  | 'im.message.update'
  | 'imbot.command.unregister'
  | 'crm.duplicate.findbycomm'
  | 'imbot.message.add';

export type B24ListOrder = 'ASC' | 'DESC';

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

export interface B24BatchCommand {
  method: B24AvailableMethods;
  params: Record<string, any>;
}

export type B24BatchCommands = Record<string, B24BatchCommand>;

export interface B24AuthOptions {
  access_token: string;
  expires: number;
  expires_in: number;
  scope: string;
  domain: string;
  server_endpoint: string;
  status: string;
  client_endpoint: string;
  member_id: string;
  user_id: number;
  refresh_token: string;
  application_token: string;
}
