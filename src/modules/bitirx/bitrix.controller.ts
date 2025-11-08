import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixUserService } from './modules/user/user.service';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { BitrixMessageService } from './modules/im/im.service';
import { AuthGuard } from '@/common/guards/auth.guard';

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
  @UseGuards(AuthGuard)
  @Get('/users/:userId')
  async getUserById(@Param('userId') userId: string) {
    try {
      return this.bitrixUserService.getUserById(userId);
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
