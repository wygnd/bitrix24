import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { JobsOptions, Queue } from 'bullmq';
import { QueueLightAddTaskHandleUpsellDeal } from '@/modules/queue/interfaces/queue-light.interface';
import { B24WebhookVoxImplantCallInitTaskOptions } from '@/modules/bitrix/application/interfaces/webhooks/webhook-voximplant-calls.interface';

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

  async addTaskHandleUpsellDeal(
    fields: QueueLightAddTaskHandleUpsellDeal,
    options?: JobsOptions,
  ) {
    return this.queueBitrixLight.add(
      QUEUE_TASKS.LIGHT.QUEUE_BX_HANDLE_UPSELL_DEAL,
      fields,
      options,
    );
  }

  async addTaskHandleWebhookFromBitrixOnVoxImplantCallInit(
    fields: B24WebhookVoxImplantCallInitTaskOptions,
    options?: JobsOptions,
  ) {
    return this.queueBitrixLight.add(
      QUEUE_TASKS.LIGHT.QUEUE_BX_HANDLE_WEBHOOK_VOXIMPLANT_CALL_INIT,
      fields,
      options,
    );
  }
}
