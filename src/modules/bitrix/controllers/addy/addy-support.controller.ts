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
import { BitrixAddySupportSendMessageDto } from '@/modules/bitrix/application/dtos/addy/addy-support-send-message.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { B24AddySupportSendMessageResponseDto } from '@/modules/bitrix/application/dtos/addy/addy-support-send-message-response.dto';
import { BitrixAddySupportUseCase } from '@/modules/bitrix/application/use-cases/addy/addy-support.use-case';

@ApiTags(B24ApiTags.ADDY)
@ApiExceptions()
@Controller({
  path: '/integration/addy/support',
  version: '1',
})
export class BitrixAddySupportControllerV1 {
  constructor(
    private readonly bitrixAddySupport: BitrixAddySupportUseCase,
  ) {}

  @ApiOperation({
    summary: 'Отправить сообщение в чат ADDY сообщения тех. поддержки',
  })
  @ApiAuthHeader()
  @ApiResponse({
    description: 'Ответ об успешной отправки сообщения',
    status: HttpStatus.OK,
    type: B24AddySupportSendMessageResponseDto,
  })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/messages/add')
  async sendMessage(@Body() fields: BitrixAddySupportSendMessageDto) {
    const response = await this.bitrixAddySupport.sendMessage(fields);

    if (!response.status) throw new BadRequestException(response);

    return response;
  }
}
