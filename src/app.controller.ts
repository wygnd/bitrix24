import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private bitrixService: BitrixUseCase) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/health')
  async getStatus() {
    return { status: 'ok' };
  }

  @Get('/test')
  async test() {
    return {
      status: this.bitrixService.isAvailableToDistributeOnManager(),
    };
  }
}
