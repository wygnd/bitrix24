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
    const extensionId = 1113785;
    const extension = await this.telphinService.getClientExtensionById(
      this.telphinService.CLIENT_ID,
      extensionId,
    );

    if (!extension) throw new BadRequestException('Invalid get extension');

    const { extension_group_id: extensionGroupId } = extension;

    // return this.telphinService.getClientExtensionList(
    //   this.telphinService.CLIENT_ID,
    // );
    return this.telphinService.getExtensionGroupList(extensionGroupId);
  }
}
