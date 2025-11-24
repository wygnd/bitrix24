import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { QueueService } from '@/modules/queue/queue.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/test')
  async testQueue() {
    return this.queueService.addTaskTest('pisapopa');
  }
}
