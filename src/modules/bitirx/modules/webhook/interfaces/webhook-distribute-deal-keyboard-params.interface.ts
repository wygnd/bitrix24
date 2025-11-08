import { B24DepartmentTypeId } from '@/modules/bitirx/modules/department/department.interface';

export interface B24DistributeDealKeyboardParams {
  handle: string;
  managerId: string;
  department: B24DepartmentTypeId;
  dealId: string;
  chatId: string;
  assignedFieldId: string;
  stage: string | null;
}