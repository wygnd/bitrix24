import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { ImbotRegisterCommandDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-register-command.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ImbotRegisterDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-register.dto';
import { ImbotMessageAddDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-message-add.dto';
import { ImbotUnregisterDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-unregister.dto';

@ApiTags(B24ApiTags.IMBOT)
@Controller('bot')
export class BitrixBotController {
  constructor(private readonly bitrixBotService: BitrixImBotService) {}

  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @ApiOperation({
    summary: 'Add new command',
  })
  @UseGuards(AuthGuard)
  @Post('/commands/add')
  async addBotCommand(@Body() body: ImbotRegisterCommandDto) {
    return this.bitrixBotService.addCommand(body);
  }

  @ApiOperation({
    summary: 'create new bot',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Post('/add')
  async addBot(@Body() fields: ImbotRegisterDto) {
    return this.bitrixBotService.registerBot(fields);
  }

  @UseGuards(AuthGuard)
  @Post('/message/add')
  async sendMessage(@Body() fields: ImbotMessageAddDto) {
    return this.bitrixBotService.sendMessage(fields);
  }

  @UseGuards(AuthGuard)
  @Get('/list')
  async getBotList() {
    return this.bitrixBotService.getBotList();
  }

  @UseGuards(AuthGuard)
  @Delete('/remove')
  async removeBot(@Body() fields: ImbotUnregisterDto) {
    return this.bitrixBotService.unregisterBot(fields);
  }
}
