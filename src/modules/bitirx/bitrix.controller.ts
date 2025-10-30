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
import { BitrixPlacementService } from '@/modules/bitirx/modules/placement/bitrix-placement.service';
import { PlacementBindDto } from '@/modules/bitirx/modules/placement/dtos/placement-bind.dto';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { PlacementUnbindDto } from '@/modules/bitirx/modules/placement/dtos/placement-unbind.dto';

@ApiExcludeController()
@ApiTags('Base methods')
@Controller()
export class BitrixController {
  constructor(
    private readonly bitrixUserService: BitrixUserService,
    private readonly bitrixMessageService: BitrixMessageService,
    private readonly bitrixPlacementService: BitrixPlacementService,
  ) {}

  /**
   * USERS
   */
  @UseGuards(AuthGuard)
  @Get('/users/:userId')
  async getUserById(@Param('userId', ParseIntPipe) userId: number) {
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

  @Post('/placement/bind')
  async bindWidget(@Body() fields: PlacementBindDto) {
    return this.bitrixPlacementService.bind(fields);
  }

  @Post('/placement/unbind')
  async unbindWidget(@Body() fields: PlacementUnbindDto) {
    return this.bitrixPlacementService.unbind(fields);
  }
}
