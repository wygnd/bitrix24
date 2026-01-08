import { B24Department } from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { BitrixAbstractPort } from '@/modules/bitrix/application/ports/abstract.port';

export interface BitrixDepartmentPort extends BitrixAbstractPort {
  getDepartmentList(): Promise<B24Department[]>;
  getDepartmentById(ids: string[]): Promise<B24Department[]>;
  getDepartmentByUserId(userId: string): Promise<B24Department[]>;
}