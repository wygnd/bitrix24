import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import {
  ApiExcludeEndpoint,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ImbotRegisterCommandDto } from '@/modules/bitrix/modules/imbot/dtos/imbot-register-command.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ImbotMessageAddDto } from '@/modules/bitrix/modules/imbot/dtos/imbot-message-add.dto';
import { BitrixBotCommandGuard } from '@/modules/bitrix/guards/bitrix-bot-command.guard';
import { OnImCommandKeyboardDto } from '@/modules/bitrix/modules/imbot/dtos/imbot-events.dto';
import { WinstonLogger } from '@/config/winston.logger';

@ApiTags(B24ApiTags.IMBOT)
@Controller('bot')
export class BitrixBotController {
  private readonly logger = new WinstonLogger(
    BitrixBotController.name,
    'bitrix:services:bot'.split(':'),
  );

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
    summary: 'Get registered bot commands',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Get('/commands')
  async getBotCommands() {
    return this.bitrixBotService.getBotCommands();
  }

  @ApiOperation({
    summary: 'Get bot command by id',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Get('/commands/:id')
  async getBotCommandById(@Param('id') commandId: string) {
    return this.bitrixBotService.getBotCommandById(commandId);
  }

  @ApiExcludeEndpoint()
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
  async addBot() {
    throw new ForbiddenException();
  }

  @ApiOperation({
    summary: 'send message from bot',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
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

  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard)
  @Delete('/remove')
  async removeBot() {
    throw new ForbiddenException();
  }

  @ApiOperation({
    summary: 'Handle bot commands',
    description: 'Available commands: ',
  })
  @UseGuards(BitrixBotCommandGuard)
  @HttpCode(HttpStatus.OK)
  @Post('onimcommandadd')
  async handleCommand(@Body() body: OnImCommandKeyboardDto) {
    this.logger.info(body);
    return this.bitrixBotService.handleOnImCommandAdd(body);
  }
}
