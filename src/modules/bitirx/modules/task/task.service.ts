import { Injectable, NotFoundException } from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  B24Task,
  B24TaskExtended,
  B24TaskSelect,
} from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24TaskResult } from '@/modules/bitirx/modules/task/interfaces/task-result.interface';
import { ImbotHandleApproveSmmAdvertLayout } from '@/modules/bitirx/modules/imbot/interfaces/imbot-handle.interface';
import { B24ImKeyboardOptions } from '@/modules/bitirx/modules/im/interfaces/im.interface';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';

@Injectable()
export class BitrixTaskService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
    private readonly botService: BitrixImBotService,
  ) {}

  async getTaskById(
    taskId: string,
    select: B24TaskSelect = [],
    saveInCache = true,
  ) {
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

    saveInCache &&
      this.redisService.set<B24TaskExtended>(
        REDIS_KEYS.BITRIX_DATA_TASK_ITEM + taskId,
        taskExtended,
        3600,
      );

    return taskExtended;
  }

  async setTaskComplete(taskId: string) {
    return this.bitrixService.callMethod<any, { task: B24Task }>(
      'tasks.task.complete',
      {
        taskId: taskId,
      },
    );
  }

  async handleObserveEdnSmmAdvertLayoutsTaskUpdate(task: B24TaskExtended) {
    const {
      status,
      responsibleId,
      id: taskId,
      title,
      accomplices,
      taskResult,
      createdBy,
    } = task;

    if (status !== '4') return;

    let message =
      'Задача: ' +
      this.bitrixService.generateTaskUrl(responsibleId, taskId, title) +
      ' была завершена. Необходимо согласовать';

    if (taskResult && taskResult?.length > 0) {
      message += '[br][br][b]Результаты задачи: [/b][br]';
      taskResult.forEach(({ text }) => {
        message += text + '[br]';
      });
    }

    const keyboardParams: ImbotHandleApproveSmmAdvertLayout = {
      taskId: taskId,
      isApproved: true,
      responsibleId: responsibleId,
      accomplices: accomplices,
      message: this.botService.encodeText(message),
    };

    const keyboardItems: B24ImKeyboardOptions[] = [
      {
        TEXT: 'Согласованно',
        COMMAND: 'approveSmmAdvertLayouts',
        COMMAND_PARAMS: JSON.stringify(keyboardParams),
        BG_COLOR_TOKEN: 'primary',
        BLOCK: 'Y',
        DISPLAY: 'LINE',
      },
      {
        TEXT: 'Не согласованно',
        COMMAND: 'approveSmmAdvertLayouts',
        COMMAND_PARAMS: JSON.stringify({
          ...keyboardParams,
          isApproved: false,
        }),
        BG_COLOR_TOKEN: 'alert',
        BLOCK: 'Y',
        DISPLAY: 'LINE',
      },
    ];

    return this.botService.sendMessage({
      MESSAGE: message,
      DIALOG_ID: createdBy,
      KEYBOARD: keyboardItems,
    });
  }
}
