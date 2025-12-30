import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixWikiService } from '@/modules/bitrix/modules/integration/wiki/services/wiki.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UnloadLostCallingDto } from '@/modules/bitrix/modules/integration/wiki/dtos/wiki-unload-lost-calling.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24WikiPaymentsNoticeWaitingDto } from '@/modules/bitrix/modules/integration/wiki/dtos/wiki-payments-notice-waiting.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { B24WikiPaymentsNoticeReceiveDto } from '@/modules/bitrix/modules/integration/wiki/dtos/wiki-payments-notice-receive.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';

@ApiTags(B24ApiTags.WIKI)
@ApiAuthHeader()
@UseGuards(AuthGuard)
@ApiExceptions()
@Controller({
  version: '1',
  path: 'integration/wiki',
})
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

    this.logger.debug(
      {
        body: fields,
        response,
      },
      true,
    );

    return response;
  }

  @ApiOperation({ summary: 'Отправить сообщение о принятии платежа' })
  @HttpCode(HttpStatus.OK)
  @Post('/payments/notices/receive')
  async sendNoticePaymentReceived(
    @Body() fields: B24WikiPaymentsNoticeReceiveDto,
  ) {
    const response =
      await this.bitrixWikiService.sendNoticeReceivePayment(fields);

    if (!response) throw new BadRequestException('Invalid send message');

    this.logger.debug(
      {
        body: fields,
        response,
      },
      true,
    );

    return response;
  }
}
