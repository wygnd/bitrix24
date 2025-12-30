import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixAddyPaymentsSendMessageDto } from '@/modules/bitrix/modules/integration/addy/dtos/addy-payments-send-message.dto';
import { BitrixAddyPaymentsService } from '@/modules/bitrix/modules/integration/addy/services/addy-payments.service';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { B24AddyPaymentsSendMessageResponseDto } from '@/modules/bitrix/modules/integration/addy/dtos/addy-payments-send-message-response.dto';

@ApiTags(B24ApiTags.ADDY)
@ApiExceptions()
@Controller({
  path: 'integration/addy/payments',
  version: '1',
})
export class BitrixAddyPaymentsControllerV1 {
  constructor(
    private readonly bitrixAddyPaymentsService: BitrixAddyPaymentsService,
  ) {}

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
  async sendMessage(@Body() fields: BitrixAddyPaymentsSendMessageDto) {
    const response = await this.bitrixAddyPaymentsService.sendMessage(fields);

    if (!response.status) throw new BadRequestException(response);

    return response;
  }
}
