import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixWikiService } from '@/modules/bitrix/modules/integration/wiki/wiki.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UnloadLostCallingDto } from '@/modules/bitrix/modules/integration/wiki/dtos/wiki-unload-lost-calling.dto';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24WikiPaymentsNoticeWaitingDto } from '@/modules/bitrix/modules/integration/wiki/dtos/wiki-payments-notice-waiting.dto';
import { WinstonLogger } from '@/config/winston.logger';

@ApiTags(B24ApiTags.WIKI)
@ApiHeader({
  name: 'Authorization',
  description: 'api key',
  example: 'bga token',
  required: true,
})
@UseGuards(AuthGuard)
@Controller('integration/wiki')
export class BitrixWikiController {
  private readonly logger = new WinstonLogger(
    BitrixWikiController.name,
    'bitrix:services:integration:wiki:'.split(':'),
  );

  constructor(private readonly bitrixWikiService: BitrixWikiService) {}

  @ApiOperation({
    summary: 'Выгрузка потерянных звонков',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/unload-lost-calling')
  async unloadLostCalling(@Body() fields: UnloadLostCallingDto) {
    return this.bitrixWikiService.unloadLostCalling(fields);
  }

  @ApiOperation({ summary: 'Отправить сообщение о поступлении платежа' })
  @HttpCode(HttpStatus.OK)
  @Post('/payments/notices/waiting')
  async sendNoticePaymentWaiting(
    @Body() fields: B24WikiPaymentsNoticeWaitingDto,
  ) {
    const response =
      await this.bitrixWikiService.sendNoticeWaitingPayment(fields);

    if (!response) throw new BadRequestException('Invalid send message');

    this.logger.info(
      {
        body: fields,
        response,
      },
      true,
    );

    return response;
  }
}
