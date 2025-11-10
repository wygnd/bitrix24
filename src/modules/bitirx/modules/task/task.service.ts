import { Injectable, NotFoundException } from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  B24Task,
  B24TaskExtended,
  B24TaskSelect,
  TaskGetOptions,
} from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24TaskResult } from '@/modules/bitirx/modules/task/interfaces/task-result.interface';

@Injectable()
export class BitrixTaskService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
  ) {}

  async getTaskById(taskId: string, select: B24TaskSelect = []) {
    const taskFromCache = await this.redisService.get<B24TaskExtended>(
      REDIS_KEYS.BITRIX_DATA_TASK_ITEM + taskId,
    );

    if (taskFromCache) return taskFromCache;

    const { get_task: task, get_task_result: taskResult } = (
      await this.bitrixService.callBatch<
        B24BatchResponseMap<{
          get_task: { task: B24Task };
          get_task_result: B24TaskResult[];
        }>
      >({
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
      3600,
    );

    return taskExtended;
  }

  async setTaskComplete(taskId: string) {
    return this.bitrixService.callMethod<{ taskId: string }, { task: B24Task }>(
      'tasks.task.complete',
      { taskId: taskId },
    );
  }
}
