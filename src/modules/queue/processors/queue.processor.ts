import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_SYNC)
export class QueueProcessor extends WorkerHost {
  async process(job: Job) {
    const { name, data } = job;

    console.log('task: ', name);
    switch (name) {
      case '':
        break;

      default:
        return false;
    }
  }

  @OnWorkerEvent('completed')
  async handleCompleteWorker(job: Job) {
    console.log('complete job: ', job.data);

    return true;
  }
}
