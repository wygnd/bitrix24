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
import {
  BitrixAddySupportSendMessageDto,
  BitrixAddySupportSendMessageResponseDto,
} from '@/modules/bitirx/modules/integration/addy/dtos/addy-support-send-message.dto';
import { BitrixAddySupportService } from '@/modules/bitirx/modules/integration/addy/services/addy-support.service';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';

@ApiTags(B24ApiTags.ADDY)
@Controller({
  path: '/integration/addy/support',
  version: '1',
})
export class BitrixAddySupportControllerV1 {
  constructor(
    private readonly bitrixAddySupportService: BitrixAddySupportService,
  ) {}

  @ApiOperation({
    summary: 'Отправить сообщение в чат ADDY сообщения тех. поддержки',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Токен авторизации',
    example: 'bga token',
  })
  @ApiResponse({
    type: BitrixAddySupportSendMessageResponseDto,
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
  async sendMessage(@Body() fields: BitrixAddySupportSendMessageDto) {
    const response = await this.bitrixAddySupportService.sendMessage(fields);

    if (!response.status) throw new BadRequestException(response);

    return response;
  }
}
