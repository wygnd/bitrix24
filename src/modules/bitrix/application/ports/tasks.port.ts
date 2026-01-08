import {
  B24Task,
  B24TaskExtended,
  B24TaskSelect,
} from '@/modules/bitrix/application/interfaces/tasks/tasks.interface';
import { B24ActionType } from '@/modules/bitrix/interfaces/bitrix.interface';
import { BitrixAbstractPort } from '@/modules/bitrix/application/ports/abstract.port';

export interface BitrixTasksPort extends BitrixAbstractPort {
  getTaskById(
    taskId: string,
    select?: B24TaskSelect,
    action?: B24ActionType,
  ): Promise<B24TaskExtended | null>;
  createTask(fields: Partial<B24Task>): Promise<B24Task | null>;
}
