import { Inject, Injectable } from '@nestjs/common';
import {
  B24Task,
  B24TaskExtended,
  B24TaskSelect,
} from '@/modules/bitrix/application/interfaces/tasks/tasks.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { ImbotHandleApproveSmmAdvertLayout } from '@/modules/bitrix/application/interfaces/bot/imbot-handle.interface';
import { B24ImKeyboardOptions } from '@/modules/bitrix/application/interfaces/messages/messages.interface';
import { B24ActionType } from '@/modules/bitrix/interfaces/bitrix.interface';
import type { BitrixTasksPort } from '@/modules/bitrix/application/ports/tasks/tasks.port';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

@Injectable()
export class BitrixTasksUseCase {
  private readonly logger = new WinstonLogger(
    BitrixTasksUseCase.name,
    'bitrix:tasks'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.TASKS.TASKS_DEFAULT)
    private readonly bitrixTasks: BitrixTasksPort,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(B24PORTS.BOT.BOT_DEFAULT)
    private readonly bitrixBot: BitrixBotPort,
  ) {}

  async getTaskById(
    id: string,
    select: B24TaskSelect = [],
    action: B24ActionType = 'cache',
  ): Promise<B24TaskExtended | null> {
    return this.bitrixTasks.getTaskById(id, select, action);
  }

  async createTask(taskFields: Partial<B24Task>): Promise<B24Task | null> {
    return this.bitrixTasks.createTask(taskFields);
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

    this.logger.debug({
      message: 'check task',
      task,
    });

    if (status !== '4') {
      this.logger.warn({
        message: `task was not handled status: ${status}`,
        task,
      });
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
      message: this.bitrixBot.encodeText(message),
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

    const responseSendMessage = await this.bitrixBot.sendMessage({
      MESSAGE: message,
      DIALOG_ID: createdBy,
      KEYBOARD: keyboardItems,
    });

    this.logger.debug({
      message: 'check response handled task',
      response: responseSendMessage,
    });

    return responseSendMessage;
  }
}
