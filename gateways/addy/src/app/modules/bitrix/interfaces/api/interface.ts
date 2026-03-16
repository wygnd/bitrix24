export type IB24AvailableMethods =
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
  | 'crm.timeline.comment.list'
  | 'crm.timeline.item.pin'
  | 'crm.timeline.item.unpin'
  | 'crm.activity.add'
  | 'event.get'
  | 'im.notify.personal.add'
  | 'im.notify.system.add'
  | 'crm.contact.list'
  | 'crm.item.list'
  | 'crm.item.update'
  | 'crm.item.add'
  | 'crm.company.list'
  | 'crm.activity.list'
  | 'crm.activity.update'
  | 'crm.activity.todo.update'
  | 'crm.activity.todo.updateResponsibleUser'
  | 'crm.category.list'
  | 'crm.dealcategory.stage.list';

export interface IB24Timestamp {
  start: number;
  finish: number;
  duration: number;
  processing: number;
  date_start: string;
  date_finish: string;
  operating_reset_at: number;
  operating: number;
}

export type TB24CRMMultiFieldTypeIds =
  | 'PHONE'
  | 'EMAIL'
  | 'WEB'
  | 'IM'
  | 'LINK';

export interface IB24CRMMultiField {
  ID: string;
  TYPE_ID: TB24CRMMultiFieldTypeIds;
  VALUE: string;
  VALUE_TYPE: string;
}

export type TB24ListOrder = 'ASC' | 'DESC';

export interface IB24ListParams<
  TFilter extends Record<string, any> = Record<string, any>,
  TOrder extends Record<string, TB24ListOrder> = Record<string, TB24ListOrder>,
  TSelect = keyof TFilter,
> {
  filter?: Partial<TFilter>;
  order?: TOrder;
  select?: TSelect[];
  start?: number;
}

export type TB24BatchCommands = Record<string, IB24BatchCommand>;

interface IB24BatchCommand<T = any> {
  method: IB24AvailableMethods;
  params: Record<string, T>;
}

export type TB24ErrorType =
  | 'invalid_client'
  | 'invalid_request'
  | 'insufficient_scope'
  | 'invalid_grant'
  | 'invalid_scope'
  | 'INTERNAL_SERVER_ERROR'
  | 'ERROR_UNEXPECTED_ANSWER'
  | 'QUERY_LIMIT_EXCEEDED'
  | 'ERROR_BATCH_METHOD_NOT_ALLOWED'
  | 'ERROR_BATCH_LENGTH_EXCEEDED'
  | 'NO_AUTH_FOUND'
  | 'INVALID_REQUEST'
  | 'OVERLOAD_LIMIT'
  | 'ACCESS_DENIED'
  | 'INVALID_CREDENTIALS'
  | 'ERROR_MANIFEST_IS_NOT_AVAILABLE'
  | 'expired_token'
  | 'user_access_error'
  | 'ERROR_CORE'
  | 'BOT_ID_ERROR'
  | 'ERR_BAD_RESPONSE';
