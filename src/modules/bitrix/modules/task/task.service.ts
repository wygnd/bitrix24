import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  B24Task,
  B24TaskExtended,
  B24TaskSelect,
} from '@/modules/bitrix/modules/task/interfaces/task.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24TaskResult } from '@/modules/bitrix/modules/task/interfaces/task-result.interface';
import { ImbotHandleApproveSmmAdvertLayout } from '@/modules/bitrix/modules/imbot/interfaces/imbot-handle.interface';
import { B24ImKeyboardOptions } from '@/modules/bitrix/modules/im/interfaces/im.interface';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixTaskService {
  private readonly logger = new WinstonLogger(
    BitrixTaskService.name,
    'bitrix:services'.split(':'),
  );

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => BitrixImBotService))
    private readonly botService: BitrixImBotService,
  ) {}

  /**
   * Get task by bitrix task ID
   *
   * ---
   *
   * Получить информацию о задаче по ID
   * @param taskId
   * @param select
   * @param force
   */
  async getTaskById(
    taskId: string,
    select: B24TaskSelect = [],
    force: boolean = false,
  ) {
    if (!force) {
      const taskFromCache = await this.redisService.get<B24TaskExtended>(
        REDIS_KEYS.BITRIX_DATA_TASK_ITEM + taskId,
      );

      if (taskFromCache) return taskFromCache;
    }

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
      3600, // 1 час
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

  async handleObserveEndSmmAdvertLayoutsTaskUpdate(task: B24TaskExtended) {
    const {
      status,
      responsibleId,
      id: taskId,
      title,
      accomplices,
      taskResult,
      createdBy,
    } = task;

    this.logger.info(
      {
        message: 'check task',
        task,
      },
      true,
    );

    if (status !== '4') {
      this.logger.warn(
        {
          message: `task was not handled status: ${status}`,
          task,
        },
        true,
      );
      return {
        status: false,
        message: `Task was in not handled status: ${status}`,
        taskId: taskId,
      };
    }

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

    const responseSendMessage = await this.botService
      .sendMessage({
        MESSAGE: message,
        DIALOG_ID: createdBy,
        KEYBOARD: keyboardItems,
      })
      .then((res) => res)
      .catch((err) => err);

    this.logger.debug(
      `check response handled task: ${JSON.stringify(responseSendMessage)}`,
    );

    this.logger.info(
      {
        message: 'check response handled task',
        response: responseSendMessage,
      },
      true,
    );

    return responseSendMessage;
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
      const { result } = await this.bitrixService.callMethod<
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
