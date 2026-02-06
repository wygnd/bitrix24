import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Render,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { WinstonLogger } from '@/config/winston.logger';

@ApiTags(B24ApiTags.PLACEMENT)
@ApiExceptions()
@Controller({
  version: '1',
  path: 'widget',
})
export class BitrixWidgetController {
  private readonly logger = new WinstonLogger(
    BitrixWidgetController.name,
    'bitrix:widgets'.split(':'),
  );

  constructor() {}

  @ApiOperation({ summary: 'Обработка PAGE_BACKGROUND_WORKER' })
  @HttpCode(HttpStatus.OK)
  @Post('/page/background/worker')
  @Render('bitrix/page/background/worker')
  async handlePageBackgroundWorker(@Body() body: any) {
    this.logger.debug({
      handler: this.handlePageBackgroundWorker.name,
      request: body,
    });
  }

  @ApiOperation({ summary: 'Обработка ошибок для PAGE_BACKGROUND_WORKER' })
  @HttpCode(HttpStatus.OK)
  @Post('page/background/error')
  async handlePageBackgroundWorkerErrors(@Body() body: any) {
    this.logger.debug({
      handler: this.handlePageBackgroundWorkerErrors.name,
      request: body,
    });
  }
}
