import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { BitrixUserService } from './methods/user/user.service';
import { ApiTags } from '@nestjs/swagger';
import { OnImCommandAddDto } from './dtos/bitrix-on-im-command-add.dto';
import { BitrixMessageService } from './methods/im/im.service';
import { error } from 'winston';

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

  /**
   * EVENTS
   */
  @Post('/events/onimcommandadd')
  async hanleOnImCommandAdd(@Body() data: OnImCommandAddDto) {
    try {
      return await this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: 'chat77152',
        MESSAGE: `Событие приложения [b](Node)[/b]![br]${JSON.stringify(data)}`,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Install app
   */
  @Post('/app/install')
  async installApp(@Body() data: any) {
    try {
      return await this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: 'chat77152',
        MESSAGE: `Установка приложения [b](Node)[/b]![br]${JSON.stringify(data)}`,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/app/handle')
  async handleApp(@Body() data: any) {
    try {
      return await this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: 'chat77152',
        MESSAGE: `Обработка приложения [b](Node)[/b]![br]${JSON.stringify(data)}`,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
