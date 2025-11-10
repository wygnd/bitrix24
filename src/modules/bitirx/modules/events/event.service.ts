import { BadRequestException, Injectable } from '@nestjs/common';
import {
  B24EventAdd,
  B24EventBody,
  B24EventTaskUpdateData,
} from '@/modules/bitirx/modules/events/interfaces/events.interface';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';
import {
  B24Task,
  B24TaskExtended,
} from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { ImbotHandleApproveSmmAdvertLayout } from '@/modules/bitirx/modules/imbot/interfaces/imbot-handle.interface';
import { B24ImKeyboardOptions } from '@/modules/bitirx/modules/im/interfaces/im.interface';

@Injectable()
export class BitrixEventService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly taskService: BitrixTaskService,
    private readonly botService: BitrixImBotService,
  ) {}

  async addEvent(fields: B24EventAdd) {
    return (
      (
        await this.bitrixService.callMethod<B24EventAdd, boolean>(
          'event.bind',
          fields,
        )
      ).result ?? false
    );
  }

  async handleTaskUpdate(fields: B24EventBody<B24EventTaskUpdateData>) {
    const { ID: taskId } = fields.data.FIELDS_BEFORE;
    const task = await this.taskService.getTaskById(taskId, undefined, false);

    if (task.title.startsWith('[МАКЕТ]'))
      return this.handleObserveEdnSmmAdvertLayoutsTaskUpdate(task);

    throw new BadRequestException('Task not handling yet');
  }

  async handleObserveEdnSmmAdvertLayoutsTaskUpdate(task: B24TaskExtended) {
    const {
      status,
      responsibleId,
      id: taskId,
      title,
      accomplices,
      taskResult,
    } = task;

    console.log(status);

    if (status !== '4') return;

    let message =
      'Задача: ' +
      this.bitrixService.generateTaskUrl(responsibleId, taskId, title) +
      ' была завершена. Необходимо согласовать';
    const keyboardParams: ImbotHandleApproveSmmAdvertLayout = {
      taskId: taskId,
      isApproved: true,
      responsibleId: responsibleId,
      accomplices: accomplices,
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
    if (taskResult && taskResult?.length > 0) {
      message += '[br][br][b]Результаты задачи: [/b][br]';
      taskResult.forEach(({ text }) => {
        message += text + '[br]';
      });
    }

    return this.botService.sendMessage({
      MESSAGE: message,
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      KEYBOARD: keyboardItems,
    });
  }
}
