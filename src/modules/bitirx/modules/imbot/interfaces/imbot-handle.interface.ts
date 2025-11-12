import { B24DepartmentTypeId } from '@/modules/bitirx/modules/department/department.interface';

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
  jobId?: string;
}

export type ImbotHandleDistributeNewDealUnknown = Pick<
  ImbotHandleDistributeNewDeal,
  'handle' | 'jobId'
>;

// export type ImbotHandleDistributeNewDealUnknown = {
//   handle: B24DistributeNewDealHandleType
// } & Record<string, any>;

export interface ImbotHandleDistributeNewDealReject {
  handle: B24DistributeNewDealHandleType;
  dealId: string;
  userId: string;
  userCounter: number;
  dealTitle: string;
}
