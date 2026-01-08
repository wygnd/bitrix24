import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Queue } from 'bullmq';
import { JobsOptions } from 'bullmq';
import { AvitoCreateLeadDto } from '@/modules/bitrix/modules/integration/avito/dtos/avito-create-lead.dto';
import { B24TaskExtended } from '@/modules/bitrix/application/interfaces/tasks/tasks.interface';

@Injectable()
export class QueueMiddleService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_MIDDLE)
    private queueBitrixMiddle: Queue,
  ) {}

  async addTaskForDistributeClientRequestFromAvito(
    data: AvitoCreateLeadDto,
    options?: JobsOptions,
  ) {
    return this.queueBitrixMiddle.add(
      QUEUE_TASKS.MIDDLE
        .QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO,
      data,
      options,
    );
  }

  /**
   * Added task on handle update task
   * @param task
   */
  async addTaskToHandleSmmTaskSmmAdvertLayouts(task: B24TaskExtended) {
    return this.queueBitrixMiddle.add(QUEUE_TASKS.MIDDLE.QUEUE_BX_TASK_UPDATE, task);
  }
}
