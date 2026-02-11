import { B24DepartmentTypeId } from '@/modules/bitrix/application/interfaces/departments/departments.interface';

export interface ImbotHandleApproveSmmAdvertLayout {
  taskId: string;
  isApproved: boolean;
  responsibleId: string;
  accomplices: string[];
  message: Buffer<ArrayBuffer>;
}

export type B24DistributeNewDealHandleType =
  | 'distributeDeal'
  | 'distributeDealReject';

export interface ImbotHandleDistributeNewDeal {
  handle: B24DistributeNewDealHandleType;
  managerId: string;
  managerName: string;
  department: B24DepartmentTypeId;
  dealId: string;
  dealTitle: string;
  chatId: string;
  assignedFieldId: string;
  stage: string | null;
}

export type ImbotHandleDistributeNewDealUnknown = Pick<
  ImbotHandleDistributeNewDeal,
  'handle'
>;

export interface ImbotHandleDistributeNewDealReject {
  handle: B24DistributeNewDealHandleType;
  dealId: string;
  userId: string;
  userCounter: number;
  dealTitle: string;
}

export interface ImbotHandleApproveSiteDealOptions {
  dealId: string;
  isApprove: boolean;
  managerId: string;
  category: 'advert' | 'seo';
  taskId: string;
}
