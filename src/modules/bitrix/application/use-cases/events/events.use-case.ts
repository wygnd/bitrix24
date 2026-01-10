import { Inject, Injectable } from '@nestjs/common';
import {
  B24EventAdd,
  B24EventBody,
  B24EventTaskUpdateData,
} from '@/modules/bitrix/application/interfaces/events/events.interface';
import { EventLeadDeleteDto } from '@/modules/bitrix/application/dtos/events/event-lead-delete.dto';
import { B24EventRemoveDto } from '@/modules/bitrix/application/dtos/events/event-remove.dto';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import { QueueMiddleService } from '@/modules/queue/queue-middle.service';
import { BitrixTasksAdapter } from '@/modules/bitrix/infrastructure/tasks/tasks.adapter';
import type { BitrixEventsPort } from '@/modules/bitrix/application/ports/events/events.port';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';

@Injectable()
export class BitrixEventsUseCase {
  constructor(
    @Inject(B24PORTS.EVENTS.EVENTS_DEFAULT)
    private readonly bitrixEvents: BitrixEventsPort,
    private readonly queueLightService: QueueLightService,
    private readonly queueMiddleService: QueueMiddleService,
    private readonly bitrixTasks: BitrixTasksAdapter,
  ) {}

  async addEvent(fields: B24EventAdd) {
    return this.bitrixEvents.addEvent(fields);
  }

  async handleTaskUpdate(fields: B24EventBody<B24EventTaskUpdateData>) {
    const { ID: taskId } = fields.data.FIELDS_BEFORE;
    const task = await this.bitrixTasks.getTaskById(taskId, undefined, 'force');

    if (task && task.title.startsWith('[МАКЕТ]')) {
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
    return this.bitrixEvents.getEventList();
  }

  async removeEvent(fields: B24EventRemoveDto) {
    return this.bitrixEvents.removeEvent(fields);
  }
}
