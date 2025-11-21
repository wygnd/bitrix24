import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import type { QueueEventCompleted } from '@/modules/queue/interfaces/queue-events.interface';

@QueueEventsListener(QUEUE_NAMES.QUEUE_BITRIX_EVENTS)
export class QueueBitrixEventsListener extends QueueEventsHost {
  @OnQueueEvent('completed')
  onCompleted(jobOptions: QueueEventCompleted) {
    console.log('comleted event', jobOptions);
  }
}
