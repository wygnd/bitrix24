import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_SYNC) private queueBitrixSync: Queue,
  ) {}

  async addTask(id: string) {
    return this.queueBitrixSync.add('transcode', { taskId: id });
  }
}
