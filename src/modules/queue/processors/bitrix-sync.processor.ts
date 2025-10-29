import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';

@Processor('bitrix_sync', { concurrency: 3 })
export class BitrixSyncProcessor extends WorkerHost {
  async process(job: Job) {
    console.log('working job,', job);

    switch (job.name) {
      case 'user.sync':
        return this.syncUsers(job.data);

      default:
        console.log('I dont know what handle now...');
    }
  }

  private async syncUsers(data: any) {
    console.log('I sync user', data);
  }
}
