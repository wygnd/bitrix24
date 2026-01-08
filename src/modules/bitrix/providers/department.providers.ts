import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixDepartmentAdapter } from '@/modules/bitrix/infrastructure/depatrments/departments.adapter';

export const departmentProviders = [
  {
    provide: B24PORTS.DEPARTMENTS.DEPARTMENT_DEFAULT,
    useClass: BitrixDepartmentAdapter,
  },
];
