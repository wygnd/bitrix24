import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASK_NAMES } from '@/modules/queue-processor/queue-processor.constants';
import { Queue } from 'bullmq';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { JobsOptions } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_EVENTS)
    private queueBitrixSync: Queue,
  ) {}

  async removeJob(jobId: string) {
    try {
      const job = await this.queueBitrixSync.getJob(jobId);

      if (!job) return false;

      job.remove().then((res) => console.log('job successful remove', res));

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Added task on handle update task
   * @param task
   */
  async addTaskBxTask(task: B24TaskExtended) {
    return this.queueBitrixSync.add(
      QUEUE_TASK_NAMES.QUEUE_BX_TASK_UPDATE,
      task,
    );
  }

  async addTaskTest(data: string, options?: JobsOptions) {
    return this.queueBitrixSync.add(
      QUEUE_TASK_NAMES.QUEUE_BX_TEST,
      data,
      options,
    );
  }
}
