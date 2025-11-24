import { QUEUE_NAMES } from '@/modules/queue-processor/queue-processor.constants';
import { QueueEventsHost, QueueEventsListener } from '@nestjs/bullmq';
import { OnQueueEvent } from '@nestjs/bull';
import type {
  QueueEventActive,
  QueueEventCompleted,
} from '@/modules/queue-processor/interfaces/queue-events.interface';
import { Logger } from '@nestjs/common';

@QueueEventsListener(QUEUE_NAMES.QUEUE_BITRIX_TEST)
export class QueueBitrixEventsListener extends QueueEventsHost {
  private readonly logger = new Logger(QueueBitrixEventsListener.name);

  @OnQueueEvent('active')
  onActive(job: QueueEventActive) {
    this.logger.debug(`Processing job ${job.jobId}...`);
  }

  @OnQueueEvent('completed')
  onCompleted(job: QueueEventCompleted) {
    this.logger.debug(`Completed job: `, job.jobId);
  }
}
