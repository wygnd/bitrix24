import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { JobsOptions, Queue } from 'bullmq';
import { HeadhunterWebhookCallDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { LeadObserveManagerCallingDto } from '@/modules/bitirx/modules/lead/dtos/lead-observe-manager-calling.dto';

@Injectable()
export class QueueHeavyService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_HEAVY)
    private queueBitrixHeavy: Queue,
  ) {}

  /**
   * Added task on handle update task
   * @param data
   * @param options
   */
  async addTaskToHandleReceiveNewRequestFromHH(
    data: HeadhunterWebhookCallDto,
    options?: JobsOptions,
  ) {
    return this.queueBitrixHeavy.add(
      QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_WEBHOOK_FROM_HH,
      data,
      options,
    );
  }

  async addTaskToHandleObserveManagerCalling(
    data: LeadObserveManagerCallingDto,
    options?: JobsOptions,
  ) {
    return this.queueBitrixHeavy.add(
      QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_OBSERVE_MANAGER_CALLING,
      data,
      options,
    );
  }

  async getJobList() {
    return this.queueBitrixHeavy.getJobs();
  }

  async getJobById(id: string) {
    return this.queueBitrixHeavy.getJob(id);
  }
}
