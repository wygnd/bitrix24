import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { NeuroService } from '@/shared/microservices/neuro/services/service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly neuroService: NeuroService) {}

  @Get()
  @Redirect('/docs', 301)
  main() {}

  @Get('/api')
  @Redirect('/docs', 301)
  api() {}

  @Get('/health')
  async getStatus() {
    return {
      gateway: 'ok',
      neuro: await this.neuroService.checkHealth(),
    };
  }
}
