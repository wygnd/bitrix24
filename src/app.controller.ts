import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { QueueHeavyService } from '@/modules/queue/queue-heavy.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly queueHeavyService: QueueHeavyService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/test')
  async testHook() {
    return this.queueHeavyService.getJobList();
  }
}
