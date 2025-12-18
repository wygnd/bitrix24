import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { BitrixMessageService } from '@/modules/bitrix/modules/im/im.service';
import {
  B24SendMessageDto,
  B24SendMessageResponse,
} from '@/modules/bitrix/modules/im/dtos/im.dto';
import { WinstonLogger } from '@/config/winston.logger';

@ApiTags(B24ApiTags.IM)
@Controller({
  path: 'messages',
  version: '1',
})
export class BitrixMessageControllerV1 {
  private readonly logger = new WinstonLogger(
    BitrixMessageControllerV1.name,
    'bitrix:services'.split(':'),
  );

  constructor(private readonly bitrixMessageService: BitrixMessageService) {}

  @ApiOperation({ summary: 'Отправить сообщение' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Токен доступа',
    example: 'bga {token}',
    required: true,
  })
  @ApiResponse({
    type: B24SendMessageResponse,
    status: HttpStatus.OK,
    description: 'Успешная отправка сообщения',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Внутренняя ошибка',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Ошибка данных',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/message/add')
  async sendMessage(@Body() body: B24SendMessageDto) {
    try {
      const response = await this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: body.userId,
        MESSAGE: body.message,
        SYSTEM: body.system ? 'Y' : 'N',
      });
      this.logger.info(response);
      return {
        status: true,
        messageId: response.result,
      };
    } catch (error) {
      this.logger.error(error, true);
      throw error;
    }
  }
}
