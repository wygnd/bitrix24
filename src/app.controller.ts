import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
@ApiExcludeController()
@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/health')
  async getStatus() {
    return { status: 'ok' };
  }
}
