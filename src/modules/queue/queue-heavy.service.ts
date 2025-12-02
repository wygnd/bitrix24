import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Queue } from 'bullmq';
import { HeadhunterWebhookCallDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-webhook-call.dto';

@Injectable()
export class QueueHeavyService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_HEAVY)
    private queueBitrixHeavy: Queue,
  ) {}

  /**
   * Added task on handle update task
   * @param data
   */
  async addTaskToHandleReceiveNewRequestFromHH(
    data: HeadhunterWebhookCallDto,
  ) {
    return this.queueBitrixHeavy.add(
      QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_WEBHOOK_FROM_HH,
      data,
    );
  }

  async addTaskToHandleReceiveNegotiationEmployerStateChange(data: any) {
    return this.queueBitrixHeavy.add(
      QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_NEGOTIATION_EMPLOYER_STATE_CHANGE,
      data,
    );
  }
}
