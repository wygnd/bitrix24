import { Injectable } from '@nestjs/common';
import { BitrixEventsAdapter } from '@/modules/bitrix/infrastructure/events/events.adapter';
import {
  B24EventAdd,
  B24EventBody,
  B24EventTaskUpdateData,
} from '@/modules/bitrix/modules/events/interfaces/events.interface';
import { EventLeadDeleteDto } from '@/modules/bitrix/modules/events/dtos/event-lead-delete.dto';
import { B24EventRemoveDto } from '@/modules/bitrix/modules/events/dtos/event-remove.dto';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import { QueueMiddleService } from '@/modules/queue/queue-middle.service';
import { BitrixTasksAdapter } from '@/modules/bitrix/infrastructure/tasks/tasks.adapter';

@Injectable()
export class BitrixEventsUseCase {
  constructor(
    private readonly bitrixEvents: BitrixEventsAdapter,
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
