import { B24Department } from '@/modules/bitrix/application/interfaces/departments/departments.interface';

export interface BitrixDepartmentPort {
  getDepartmentList(): Promise<B24Department[]>;
  getDepartmentById(ids: string[]): Promise<B24Department[]>;
  getDepartmentByUserId(userId: string): Promise<B24Department[]>;
}
