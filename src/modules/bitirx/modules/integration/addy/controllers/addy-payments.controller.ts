import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  BitrixAddyPaymentsSendMessageDto,
  BitrixAddyPaymentsSendMessageResponseDto,
} from '@/modules/bitirx/modules/integration/addy/dtos/addy-payments-send-message.dto';
import { BitrixAddyPaymentsService } from '@/modules/bitirx/modules/integration/addy/services/addy-payments.service';

@ApiTags(B24ApiTags.ADDY)
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
  @ApiHeader({
    name: 'Authorization',
    description: 'Токен авторизации',
    example: 'bga token',
  })
  @ApiResponse({
    type: BitrixAddyPaymentsSendMessageResponseDto,
    status: HttpStatus.OK,
    description: 'Успешная отправка сообщения',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Ошибка валдиации полей',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Ошибка авторизации',
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
