import { B24TaskResult } from '@/modules/bitirx/modules/task/interfaces/task-result.interface';

export interface B24TaskCreator {
  id: string;
  name: string;
  link: string;
  icon: string;
  workPosition: string;
}

export interface B24TaskResponsible {
  id: string;
  name: string;
  link: string;
  icon: string;
  workPosition: string;
}

export interface B24TaskAction {
  accept: boolean;
  decline: boolean;
  complete: boolean;
  approve: boolean;
  disapprove: boolean;
  start: boolean;
  pause: boolean;
  delegate: boolean;
  remove: boolean;
  edit: boolean;
  defer: boolean;
  renew: boolean;
  create: boolean;
  changeDeadline: boolean;
  checklistAddItems: boolean;
  addFavorite: boolean;
  deleteFavorite: boolean;
  rate: boolean;
  take: boolean;
  'edit.originator': boolean;
  'checklist.reorder': boolean;
  'elapsedtime.add': boolean;
  'dayplan.timer.toggle': boolean;
  'edit.plan': boolean;
  'checklist.add': boolean;
  'favorite.add': boolean;
  'favorite.delete': boolean;
}

export interface B24TaskCheckListTree {
  nodeId: number;
  fields: B24TaskFields;
  action: any[];
  descendants: any[];
}

export interface B24TaskFields {
  id: any;
  copiedId: any;
  entityId: any;
  userId: number;
  createdBy: any;
  parentId: any;
  title: string;
  sortIndex: any;
  displaySortIndex: string;
  isComplete: boolean;
  isImportant: boolean;
  completedCount: number;
  members: any[];
  attachments: any[];
  nodeId: any;
}

export interface B24Task {
  id: string;
  parentId: string;
  title: string;
  description: string;
  mark: any;
  priority: string;
  multitask: string;
  notViewed: string;
  replicate: string;
  stageId: string;
  sprintId: any;
  backlogId: any;
  createdBy: string;
  createdDate: string;
  responsibleId: string;
  changedBy: string;
  changedDate: string;
  statusChangedBy: string;
  closedBy: string;
  closedDate: string;
  activityDate: string;
  dateStart: any;
  deadline: string;
  startDatePlan: any;
  endDatePlan: any;
  guid: string;
  xmlId: any;
  commentsCount: string;
  serviceCommentsCount: string;
  allowChangeDeadline: string;
  allowTimeTracking: string;
  taskControl: string;
  addInReport: string;
  forkedByTemplateId: any;
  timeEstimate: string;
  timeSpentInLogs: any;
  matchWorkTime: string;
  forumTopicId: string;
  forumId: string;
  siteId: string;
  subordinate: string;
  exchangeModified: any;
  exchangeId: any;
  outlookVersion: string;
  viewedDate: string;
  sorting: any;
  durationFact: any;
  isMuted: string;
  isPinned: string;
  isPinnedInGroup: string;
  flowId: any;
  descriptionInBbcode: string;
  status: string;
  statusChangedDate: string;
  durationPlan: string;
  durationType: string;
  favorite: string;
  groupId: string;
  auditors: any[];
  accomplices: any[];
  checklist: any[];
  group: any[];
  creator: B24TaskCreator;
  responsible: B24TaskResponsible;
  accomplicesData: any[];
  auditorsData: any[];
  newCommentsCount: number;
  action: B24TaskAction;
  checkListTree: B24TaskCheckListTree;
  checkListCanAdd: boolean;
}

export type B24TaskSelect = Array<keyof B24Task>;

export interface TaskGetOptions {
  taskId: string;
  select?: B24TaskSelect;
}

export type B24TaskExtended = B24Task & { taskResult: B24TaskResult[] };
