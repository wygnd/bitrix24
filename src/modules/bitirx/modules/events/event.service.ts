import { Injectable } from '@nestjs/common';
import {
  B24EventAdd,
  B24EventBody,
  B24EventTaskUpdateData,
} from '@/modules/bitirx/modules/events/interfaces/events.interface';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';
import { EventLeadDeleteDto } from '@/modules/bitirx/modules/events/dtos/event-lead-delete.dto';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import { QueueMiddleService } from '@/modules/queue/queue-middle.service';
import { B24EventRemoveDto } from '@/modules/bitirx/modules/events/dtos/event-remove.dto';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixEventService {
  private readonly logger = new WinstonLogger(BitrixEventService.name);

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

  async handleLeadDelete({ data }: EventLeadDeleteDto) {
    this.queueLightService.addTaskSendWikiRequestOnDeleteLead(data.FIELDS.ID).then(res => {
      this.logger.info(`Added in queue: ${JSON.stringify(data)} => ${res.toJSON()}`);
    });
    return true;
  }

  async getEventList() {
    return this.bitrixService.callMethod('event.get');
  }

  async removeEvent(fields: B24EventRemoveDto) {
    return this.bitrixService.callMethod('event.unbind', fields);
  }
}
