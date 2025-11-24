import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Queue } from 'bullmq';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';

@Injectable()
export class QueueLightService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_LIGHT)
    private queueBitrixLight: Queue,
  ) {}

  async removeJob(jobId: string) {
    try {
      const job = await this.queueBitrixLight.getJob(jobId);

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
    return this.queueBitrixLight.add(QUEUE_TASKS.LIGHT.QUEUE_BX_TASK_UPDATE, task);
  }

  async addTaskSendWikiRequestOnDeleteLead(leadId: string) {
    return this.queueBitrixLight.add(QUEUE_TASKS.LIGHT.QUEUE_BX_EVENTS_SEND_WIKI_ON_LEAD_DELETE, leadId);
  }
}
