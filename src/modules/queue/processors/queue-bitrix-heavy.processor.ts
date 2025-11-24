import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { Processor, WorkerHost } from '@nestjs/bullmq';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_HEAVY, { concurrency: 1 })
export class QueueBitrixHeavyProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixHeavyProcessor.name);

  constructor() {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data } = job;

    this.logger.warn(`not handled yet: ${name}`);
    return {
      message: 'Not handled',
      status: QueueProcessorStatus.OK,
      data: null,
    } as QueueProcessorResponse<null>;
  }

  /* ==================== EVENTS LISTENERS ==================== */
}
