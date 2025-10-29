import { Controller, Get, Redirect } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Redirect('/api', 301)
  async main() {}
}
