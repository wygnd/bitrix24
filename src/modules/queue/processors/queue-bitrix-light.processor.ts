import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { WikiService } from '@/modules/wiki/wiki.service';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_LIGHT, { concurrency: 10 })
export class QueueBitrixLightProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixLightProcessor.name);

  constructor(private readonly wikiService: WikiService) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data } = job;
    const response: QueueProcessorResponse = {
      message: '',
      status: QueueProcessorStatus.OK,
      data: null,
    };

    switch (name) {
      case QUEUE_TASKS.LIGHT.QUEUE_BX_EVENTS_SEND_WIKI_ON_LEAD_DELETE:
        break;

      default:
        response.message = 'Not handled';
        break;
    }

    this.logger.warn(`not handled yet: ${name}`);
    return response;
  }

  /* ==================== EVENTS LISTENERS ==================== */
}
