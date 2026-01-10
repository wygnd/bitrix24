import type { BitrixTasksPort } from '@/modules/bitrix/application/ports/tasks/tasks.port';
import { NotFoundException } from '@nestjs/common';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import {
  B24Task,
  B24TaskExtended,
  B24TaskSelect,
} from '@/modules/bitrix/application/interfaces/tasks/tasks.interface';
import { B24ActionType } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24TaskResult } from '@/modules/bitrix/application/interfaces/tasks/tasks-result.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { RedisService } from '@/modules/redis/redis.service';
import { WinstonLogger } from '@/config/winston.logger';

export class BitrixTasksAdapter implements BitrixTasksPort {
  private readonly logger = new WinstonLogger(
    BitrixTasksAdapter.name,
    'bitrix:tasks'.split(':'),
  );

  constructor(
    private readonly bitrixApiService: BitrixApiService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get task by bitrix task ID
   *
   * ---
   *
   * Получить информацию о задаче по ID
   * @param taskId
   * @param select
   * @param action
   */
  async getTaskById(
    taskId: string,
    select: B24TaskSelect = [],
    action: B24ActionType = 'cache',
  ) {
    try {
      if (action == 'cache') {
        const taskFromCache = await this.redisService.get<B24TaskExtended>(
          REDIS_KEYS.BITRIX_DATA_TASK_ITEM + taskId,
        );

        if (taskFromCache) return taskFromCache;
      }

      const { get_task: task, get_task_result: taskResult } = (
        await this.bitrixApiService.callBatch<{
          get_task: { task: B24Task };
          get_task_result: B24TaskResult[];
        }>({
          get_task: {
            method: 'tasks.task.get',
            params: {
              taskId: taskId,
              select: select,
            },
          },
          get_task_result: {
            method: 'tasks.task.result.list',
            params: {
              taskId: taskId,
            },
          },
        })
      ).result.result;

      if (!task || Object.keys(task).length === 0)
        throw new NotFoundException('Task not found');

      const taskExtended: B24TaskExtended = {
        ...task.task,
        taskResult: taskResult,
      };

      this.redisService.set<B24TaskExtended>(
        REDIS_KEYS.BITRIX_DATA_TASK_ITEM + taskId,
        taskExtended,
        3600, // 1 час
      );

      return taskExtended;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Create new task in bitrix24
   *
   * ---
   *
   * Создает новую задачу в битрикс24
   * @param fields
   */
  async createTask(fields: Partial<B24Task>): Promise<B24Task | null> {
    try {
      const { result } = await this.bitrixApiService.callMethod<
        { fields: Partial<B24Task> },
        { task: B24Task }
      >('tasks.task.add', {
        fields: fields,
      });

      return result ? result.task : null;
    } catch (error) {
      this.logger.error(error, true);
      return null;
    }
  }
}
