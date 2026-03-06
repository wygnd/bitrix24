import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixTasksAdapter } from '@/modules/bitrix/infrastructure/adapters/tasks/tasks.adapter';

export const taskProviders = [
  {
    provide: B24PORTS.TASKS.TASKS_DEFAULT,
    useClass: BitrixTasksAdapter,
  },
];
