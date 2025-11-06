import { Controller, Get, Param } from '@nestjs/common';
import { QueueProcessor } from '@/modules/queue/processors/queue.processor';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import { QueueService } from '@/modules/queue/queue.service';

@Controller('tasks')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('/:id')
  async testQueue(@Param('id') id: string) {
    return this.queueService.addTask(id);
  }
}
