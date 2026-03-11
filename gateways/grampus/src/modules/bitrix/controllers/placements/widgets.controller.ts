import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Render,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixWidgetUseCase } from '@/modules/bitrix/application/use-cases/widgets/widget.use-case';
import { PlusToSpacePipe } from '@/common/pipes/plus-to-space.pipe';

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

  constructor(private readonly widgetService: BitrixWidgetUseCase) {}

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

  @ApiOperation({ summary: 'Получить данные звонка по номеру' })
  @Get('/page/background/worker/data/call/initialized')
  async handleGetDataPageBackgroundWorder(
    @Query('phone', PlusToSpacePipe) phone: string,
  ) {
    return this.widgetService.getDataForCallOnBackgroundWorker(phone);
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
