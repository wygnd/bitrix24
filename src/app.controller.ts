import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { WikiService } from '@/modules/wiki/wiki.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Redirect('/api', 301)
  async main() {}
}
