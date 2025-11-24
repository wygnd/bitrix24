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

@Injectable()
export class BitrixEventService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly taskService: BitrixTaskService,
    private readonly queueLightService: QueueLightService,
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
      this.taskService.handleObserveEdnSmmAdvertLayoutsTaskUpdate(task);
      return true;
    }

    return false;
  }

  async handleLeadDelete({ data }: EventLeadDeleteDto) {
    this.queueLightService.addTaskSendWikiRequestOnDeleteLead(data.FIELDS.ID);
    return true;
  }
}
