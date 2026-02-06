import { Controller, HttpCode, HttpStatus, Post, Render } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';

@ApiTags(B24ApiTags.PLACEMENT)
@ApiExceptions()
@Controller({
  version: '1',
  path: 'widget',
})
export class BitrixWidgetController {
  constructor() {}

  @ApiOperation({ summary: 'Обработка PAGE_BACKGROUND_WORKER' })
  @HttpCode(HttpStatus.OK)
  @Post('/page/background')
  @Render('bitrix/page/background/worker')
  async handlePageBackgroundWorker() {}
}
