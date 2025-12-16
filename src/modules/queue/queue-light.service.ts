import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { JobsOptions, Queue } from 'bullmq';
import { WikiUpdateLeadRequest } from '@/modules/wiki/interfaces/wiki-update-lead.interface';
import { QueueLightAddTaskHandleUpsellDeal } from '@/modules/queue/interfaces/queue-light.interface';
import {
  B24VoxImplantCallStartDataOptions
} from '@/modules/bitrix/modules/events/interfaces/event-voximplant-call-start.interface';

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

  async addTaskSendUpdateLeadToNewWikiFromRequestAvito(
    data: WikiUpdateLeadRequest,
  ) {
    return this.queueBitrixLight.add(
      QUEUE_TASKS.LIGHT.QUEUE_BX_SEND_UPDATE_LEAD_NEW_WIKI_FROM_REQUEST_AVITO,
      data,
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

  async addTaskHandleWebhookFromBitrixOnVoxImplantCallStart(
    fields: B24VoxImplantCallStartDataOptions,
    options?: JobsOptions,
  ) {
    return this.queueBitrixLight.add(QUEUE_TASKS.LIGHT.QUEUE_BX_HANDLE_WEBHOOK_VOXIMPLANT_CALL_START, fields, options);
  }
}
