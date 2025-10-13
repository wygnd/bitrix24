import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('bitrix.sync', { concurrency: 3 })
export class BitrixSyncProcessor extends WorkerHost {
  async process(job: Job) {
    console.log('working job,', job);

    switch (job.name) {
      case 'user.sync':
        return this.syncUsers(job.data);
    }
  }

  private async syncUsers(data: any) {
    console.log('I sync user');
  }
}
