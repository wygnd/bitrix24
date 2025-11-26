import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { BitrixMessageService } from './modules/im/im.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { AuthGuard } from '@/common/guards/auth.guard';

@ApiExcludeController()
@ApiTags('Base methods')
@Controller()
export class BitrixController {
  constructor(
    private readonly bitrixMessageService: BitrixMessageService,
    private readonly bitrixService: BitrixService,
  ) {}

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

  @UseGuards(AuthGuard)
  @Get('/managers/is-available-distribute')
  async getIsAvailableToDistribute() {
    return this.bitrixService.isAvailableToDistributeOnManager();
  }
}
