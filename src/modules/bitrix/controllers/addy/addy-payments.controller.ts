import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixAddyPaymentsSendMessageQueryDTO } from '@/modules/bitrix/application/dtos/addy/addy-payments-send-message.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { B24AddyPaymentsSendMessageResponseDto } from '@/modules/bitrix/application/dtos/addy/addy-payments-send-message-response.dto';
import { BitrixAddyPaymentsUseCase } from '@/modules/bitrix/application/use-cases/addy/addy-paymnets.use-case';

@ApiTags(B24ApiTags.ADDY)
@ApiExceptions()
@Controller({
  path: 'integration/addy/payments',
  version: '1',
})
export class BitrixAddyPaymentsControllerV1 {
  constructor(private readonly bitrixAddyPayments: BitrixAddyPaymentsUseCase) {}

  @ApiOperation({
    summary: 'Отправить сообщение в чат ADDY счета на оплату',
  })
  @ApiAuthHeader()
  @ApiResponse({
    description: 'Ответ об успешной отправки сообщения',
    status: HttpStatus.OK,
    type: B24AddyPaymentsSendMessageResponseDto,
  })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/messages/add')
  async sendMessage(
    @Query() query: BitrixAddyPaymentsSendMessageQueryDTO,
    @Body() body: unknown,
  ) {
    return this.bitrixAddyPayments.sendMessageByType(query, body);
  }
}
