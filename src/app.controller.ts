import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Redirect('/docs', 301)
  main() {}

  @Get('/api')
  @Redirect('/docs', 301)
  api() {}

  @Get('/health')
  async getStatus() {
    return { status: 'ok' };
  }
}
