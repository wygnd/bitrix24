import { Injectable } from '@nestjs/common';
import { BitrixTasksAdapter } from '@/modules/bitrix/infrastructure/tasks/tasks.adapter';
import {
  B24Task,
  B24TaskExtended,
} from '@/modules/bitrix/application/interfaces/tasks/tasks.interface';

@Injectable()
export class BitrixTasksUseCase {
  constructor(private readonly bitrixTasks: BitrixTasksAdapter) {}

  async getTaskById(id: string): Promise<B24TaskExtended | null> {
    return this.bitrixTasks.getTaskById(id);
  }

  async createTask(taskFields: Partial<B24Task>): Promise<B24Task | null> {
    return this.bitrixTasks.createTask(taskFields);
  }
}
