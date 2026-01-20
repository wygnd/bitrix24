export type B24AvailableMethods =
  | 'user.current'
  | 'user.get'
  | 'crm.lead.get'
  | 'crm.lead.list'
  | 'crm.lead.update'
  | 'crm.lead.add'
  | 'crm.deal.fields'
  | 'crm.stagehistory.list'
  | 'tasks.task.add'
  | 'tasks.task.list'
  | 'tasks.task.get'
  | 'tasks.task.delete'
  | 'tasks.task.complete'
  | 'tasks.task.result.list'
  | 'tasks.task.disapprove'
  | 'tasks.task.approve'
  | 'tasks.task.update'
  | 'department.get'
  | 'crm.deal.list'
  | 'crm.deal.add'
  | 'crm.deal.get'
  | 'crm.deal.update'
  | 'im.message.add'
  | 'imbot.command.register'
  | 'im.message.delete'
  | 'im.message.update'
  | 'imbot.command.unregister'
  | 'crm.duplicate.findbycomm'
  | 'imbot.register'
  | 'imbot.unregister'
  | 'imbot.message.add'
  | 'imbot.message.update'
  | 'imbot.bot.list'
  | 'placement.bind'
  | 'placement.unbind'
  | 'placement.get'
  | 'event.bind'
  | 'event.unbind'
  | 'crm.timeline.comment.add'
  | 'crm.timeline.item.pin'
  | 'crm.activity.add'
  | 'event.get'
  | 'im.notify.personal.add'
  | 'im.notify.system.add'
  | 'crm.contact.list'
  | 'crm.item.list'
  | 'crm.company.list'
  | 'crm.activity.list'
  | 'crm.activity.update';

export type B24ListOrder = 'ASC' | 'DESC';

export interface B24ListParams<
  TFilter extends Record<string, any> = Record<string, any>,
  TOrder extends Record<string, B24ListOrder> = Record<string, B24ListOrder>,
  TSelect = keyof TFilter,
> {
  filter?: TFilter;
  order?: TOrder;
  select?: TSelect[];
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

export interface B24BatchCommand<T = any> {
  method: B24AvailableMethods;
  params: Record<string, T>;
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

export type B24ActionType = 'force' | 'cache';

export enum B24DealCategories {
  SITE = 'site',
  ADVERT = 'advert',
  SEO = 'seo',
  UNKNOWN = 'unknown',
}
