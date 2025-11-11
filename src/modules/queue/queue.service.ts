import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASK_NAMES } from '@/modules/queue/queue.constants';
import { Queue } from 'bullmq';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_EVENTS)
    private queueBitrixSync: Queue,
  ) {}

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
}
