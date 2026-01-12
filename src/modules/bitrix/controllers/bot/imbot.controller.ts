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
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ImbotRegisterCommandDto } from '@/modules/bitrix/application/dtos/bot/imbot-register-command.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ImbotMessageAddDto } from '@/modules/bitrix/application/dtos/bot/imbot-message-add.dto';
import { BitrixBotCommandGuard } from '@/modules/bitrix/guards/bitrix-bot-command.guard';
import { OnImCommandKeyboardDto } from '@/modules/bitrix/application/dtos/bot/imbot-events.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixBotUseCase } from '@/modules/bitrix/application/use-cases/bot/bot.use-case';

@ApiTags(B24ApiTags.IMBOT)
@ApiExceptions()
@Controller('bot')
export class BitrixBotController {
  private readonly logger = new WinstonLogger(
    BitrixBotController.name,
    'bitrix:services:bot'.split(':'),
  );

  constructor(private readonly bitrixBotService: BitrixBotUseCase) {}

  @ApiAuthHeader()
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
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Get('/commands')
  async getBotCommands() {
    return this.bitrixBotService.getCommands();
  }

  @ApiOperation({
    summary: 'Get bot command by id',
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Get('/commands/:id')
  async getBotCommandById(@Param('id') commandId: string) {
    return this.bitrixBotService.getCommandById(commandId);
  }

  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'create new bot',
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Post('/add')
  async addBot() {
    throw new ForbiddenException();
  }

  @ApiOperation({
    summary: 'send message from bot',
  })
  @ApiAuthHeader()
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
    this.logger.debug(body);
    return this.bitrixBotService.handleOnImCommandAdd(body);
  }
}
