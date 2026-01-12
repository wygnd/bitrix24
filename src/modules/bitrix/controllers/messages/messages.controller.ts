import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import {
  B24SendMessageDto,
  B24SendMessageResponse,
} from '@/modules/bitrix/application/dtos/messages/messages.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixMessagesUseCase } from '@/modules/bitrix/application/use-cases/messages/messages.use-case';

@ApiTags(B24ApiTags.IM)
@ApiExceptions()
@Controller({
  path: 'messages',
  version: '1',
})
export class BitrixMessageControllerV1 {
  private readonly logger = new WinstonLogger(
    BitrixMessageControllerV1.name,
    'bitrix:services'.split(':'),
  );

  constructor(private readonly bitrixMessages: BitrixMessagesUseCase) {}

  @ApiOperation({ summary: 'Отправить сообщение' })
  @ApiAuthHeader()
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
      const response = await this.bitrixMessages.sendPrivateMessage({
        DIALOG_ID: body.userId,
        MESSAGE: body.message,
        SYSTEM: body.system ? 'Y' : 'N',
      });
      this.logger.debug(response);
      return {
        status: true,
        messageId: response,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
