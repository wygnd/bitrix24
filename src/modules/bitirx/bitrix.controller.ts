import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { BitrixUserService } from './modules/user/user.service';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { BitrixMessageService } from './modules/im/im.service';

@ApiExcludeController()
@ApiTags('Base methods')
@Controller()
export class BitrixController {
  constructor(
    private readonly bitrixUserService: BitrixUserService,
    private readonly bitrixMessageService: BitrixMessageService,
  ) {}

  /**
   * USERS
   */
  @Get('/users/:userId')
  async getUserById(@Param('userId', ParseIntPipe) userId: number) {
    try {
      return await this.bitrixUserService.getUserById(userId);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/app/handle')
  async handleApp(@Body() data: any) {
    try {
      return await this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: 'chat77152',
        MESSAGE: `Обработка приложения [b](Node)![/b][br][br]${JSON.stringify(data) ?? ''}`,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
