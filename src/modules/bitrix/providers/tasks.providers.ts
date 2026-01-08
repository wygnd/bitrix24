import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixTasksAdapter } from '@/modules/bitrix/infrastructure/tasks/tasks.adapter';

export const tasksProviders = [
  {
    provide: B24PORTS.TASKS.TASKS_DEFAULT,
    useClass: BitrixTasksAdapter,
  },
];
