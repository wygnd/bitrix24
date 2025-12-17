import { BadRequestException, Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TelphinService } from '@/modules/telphin/telphin.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly telphinService: TelphinService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/health')
  async getStatus() {
    return { status: 'ok' };
  }

  @Get('/test')
  async testHook() {
    const telphinAppInfo = await this.telphinService.getUserInfo();

    if (!telphinAppInfo)
      throw new BadRequestException('Invalid get telphin application info');

    return this.telphinService.getClientExtensionByBitrixUserId(telphinAppInfo.client_id, '522');
  }
}
