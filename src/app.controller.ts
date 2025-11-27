import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { WikiService } from '@/modules/wiki/wiki.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly wikiService: WikiService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/test')
  async testHook() {
    return this.wikiService.getWorkingSalesFromWiki(true);
  }
}
