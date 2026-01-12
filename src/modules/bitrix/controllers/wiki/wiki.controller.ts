import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UnloadLostCallingDto } from '@/modules/bitrix/application/dtos/wiki/wiki-unload-lost-calling.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24WikiPaymentsNoticeWaitingDto } from '@/modules/bitrix/application/dtos/wiki/wiki-payments-notice-waiting.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { B24WikiPaymentsNoticeReceiveDto } from '@/modules/bitrix/application/dtos/wiki/wiki-payments-notice-receive.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixWikiUseCase } from '@/modules/bitrix/application/use-cases/wiki/wiki.use-case';

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

  constructor(private readonly bitrixWiki: BitrixWikiUseCase) {}

  @ApiOperation({
    summary: 'Выгрузка потерянных звонков',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/unload-lost-calling')
  async unloadLostCalling(@Body() fields: UnloadLostCallingDto) {
    return this.bitrixWiki.unloadLostCalling(fields);
  }

  @ApiOperation({ summary: 'Отправить сообщение о поступлении платежа' })
  @HttpCode(HttpStatus.OK)
  @Post('/payments/notices/waiting')
  async sendNoticePaymentWaiting(
    @Body() fields: B24WikiPaymentsNoticeWaitingDto,
  ) {
    const response = await this.bitrixWiki.sendNoticeWaitingPayment(fields);

    if (!response) throw new BadRequestException('Invalid send message');

    this.logger.debug({
      body: fields,
      response,
    });

    return response;
  }

  @ApiOperation({ summary: 'Отправить сообщение о принятии платежа' })
  @HttpCode(HttpStatus.OK)
  @Post('/payments/notices/receive')
  async sendNoticePaymentReceived(
    @Body() fields: B24WikiPaymentsNoticeReceiveDto,
  ) {
    const response = await this.bitrixWiki.sendNoticeReceivePayment(fields);

    if (!response) throw new BadRequestException('Invalid send message');

    this.logger.debug({
      body: fields,
      response,
    });

    return response;
  }
}
