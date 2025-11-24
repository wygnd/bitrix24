import { QueueEventsHost, QueueEventsListener } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import { OnQueueEvent } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

@QueueEventsListener(QUEUE_NAMES.QUEUE_BITRIX_LIGHT)
export class QueueBitrixLightListener extends QueueEventsHost {
  private readonly logger = new Logger(QueueBitrixLightListener.name);

  // @OnQueueEvent('active')
  // onActive(job: { jobId: string; prev?: string }) {
  //   this.logger.debug(`active job: ${job}`);
  // }

  // @OnQueueEvent('completed')
  // onCompleted(job: { jobId: string; prev?: string; returnvalue?: any }) {
  //   this.logger.debug(`completed job: ${job}`);
  // }
}
