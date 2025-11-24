import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Queue } from 'bullmq';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { JobsOptions } from 'bullmq';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';

@Injectable()
export class QueueMiddleService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_MIDDLE)
    private queueBitrixMiddle: Queue,
  ) {}


  /**
   * Added task on handle update task
   * @param task
   */
  async addTaskBxTask(task: B24TaskExtended) {
    return this.queueBitrixMiddle.add(QUEUE_TASKS.QUEUE_BX_TASK_UPDATE, task);
  }

  async addTaskTest(data: string, options?: JobsOptions) {
    return this.queueBitrixMiddle.add(QUEUE_TASKS.QUEUE_BX_TEST, data, options);
  }

  async addTaskForDistributeClientRequestFromAvito(
    data: AvitoCreateLeadDto,
    options?: JobsOptions,
  ) {
    return this.queueBitrixMiddle.add(
      QUEUE_TASKS.QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO,
      data,
      options,
    );
  }
}
