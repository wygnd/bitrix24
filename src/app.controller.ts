import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { BitrixService } from '@/modules/bitirx/bitrix.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly bitrixService: BitrixService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/test')
  async testHandle() {
    return this.bitrixService.isAvailableToDistributeOnManager();
  }
}
