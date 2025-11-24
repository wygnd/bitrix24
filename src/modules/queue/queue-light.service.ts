import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Queue } from 'bullmq';

@Injectable()
export class QueueLightService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_LIGHT)
    private queueBitrixLight: Queue,
  ) {}

  async addTaskSendWikiRequestOnDeleteLead(leadId: string) {
    return this.queueBitrixLight.add(
      QUEUE_TASKS.LIGHT.QUEUE_BX_EVENTS_SEND_WIKI_ON_LEAD_DELETE,
      leadId,
    );
  }
}
