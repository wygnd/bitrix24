import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BitrixHeadHunterService } from '@/modules/bitirx/modules/integration/headhunter/headhunter.service';
import {
  HeadhunterWebhookCallDto
} from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-webhook-call.dto';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_HEAVY, { concurrency: 1 })
export class QueueBitrixHeavyProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixHeavyProcessor.name);

  constructor(private readonly bitrixHeadhunterIntegrationService: BitrixHeadHunterService) {
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
      case QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_NEW_RESPONSE_OR_NEGOTIATION:
        response.data = await this.bitrixHeadhunterIntegrationService.handleNewResponseVacancyWebhook(data as HeadhunterWebhookCallDto);
        break;

      default:
        this.logger.warn(`not handled yet: ${name}`);
        response.message = 'Not handled';
        response.status = QueueProcessorStatus.NOT_HANDLED;
        break;
    }

    return response;
  }

  /* ==================== EVENTS LISTENERS ==================== */
}
