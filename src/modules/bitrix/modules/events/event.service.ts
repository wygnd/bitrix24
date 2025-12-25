import { Injectable } from '@nestjs/common';
import {
  B24EventAdd,
  B24EventBody,
  B24EventTaskUpdateData,
} from '@/modules/bitrix/modules/events/interfaces/events.interface';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { BitrixTaskService } from '@/modules/bitrix/modules/task/task.service';
import { EventLeadDeleteDto } from '@/modules/bitrix/modules/events/dtos/event-lead-delete.dto';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import { QueueMiddleService } from '@/modules/queue/queue-middle.service';
import { B24EventRemoveDto } from '@/modules/bitrix/modules/events/dtos/event-remove.dto';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixEventService {
  private readonly logger = new WinstonLogger(
    BitrixEventService.name,
    'bitrix:services'.split(':'),
  );

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly taskService: BitrixTaskService,
    private readonly queueLightService: QueueLightService,
    private readonly queueMiddleService: QueueMiddleService,
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
    const task = await this.taskService.getTaskById(taskId, undefined, true);

    if (task.title.startsWith('[МАКЕТ]')) {
      this.queueMiddleService.addTaskToHandleSmmTaskSmmAdvertLayouts(task);
      return true;
    }

    return false;
  }

  async handleLeadDelete(fields: EventLeadDeleteDto) {
    const { data } = fields;

    this.queueLightService.addTaskSendWikiRequestOnDeleteLead(data.FIELDS.ID);
    return true;
  }

  async getEventList() {
    return this.bitrixService.callMethod('event.get');
  }

  async removeEvent(fields: B24EventRemoveDto) {
    return this.bitrixService.callMethod('event.unbind', fields);
  }
}
