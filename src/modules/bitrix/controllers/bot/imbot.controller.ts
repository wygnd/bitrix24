import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixBotCommandsRepositoryPort } from '@/modules/bitrix/application/ports/bot/bot-commands-repository.port';

@ApiTags(B24ApiTags.IMBOT)
@ApiExceptions()
@Controller('bot')
export class BitrixBotController {
  private readonly logger = new WinstonLogger(
    BitrixBotController.name,
    'bitrix:bot'.split(':'),
  );

  constructor(
    private readonly bitrixBotService: BitrixBotUseCase,
    @Inject(B24PORTS.BOT.BOT_COMMANDS_REPOSITORY)
    private readonly bitrixBotCommandsRepository: BitrixBotCommandsRepositoryPort,
  ) {}

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

  @ApiOperation({
    summary: 'Удалить обработку команды',
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Delete('/commands/:id')
  async removeCommand(@Param('id') commandId: string) {
    return this.bitrixBotService.removeCommand(commandId);
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

  @Post('/database/add')
  async addCommandsToDB() {
    const botId = 1338;
    const handler = 'https://bitrix-grampus.ru/bot/onimcommandadd';
    const items = [
      {
        command_id: 96,
        command: 'distributeNewDeal',
        description: 'Распределить новые сделки',
      },
      {
        command_id: 98,
        command: 'approveSmmAdvertLayouts',
        description: 'Согласовать рекламные макеты',
      },
      {
        command_id: 120,
        command: 'approveSiteDealFor',
        description: 'Согласовать сайт для доп. услуг',
      },
      {
        command_id: 102,
        command: 'approveSiteForCase',
        description: 'Солгасовать сайт для кейса',
      },
      {
        command_id: 108,
        command: 'approveDistributeDealFromAvitoByAI',
        description: 'Подтвердить обработку лида нейронкой',
      },
      {
        command_id: 110,
        command: 'approveReceivedPayment',
        description: 'Подтвердить платеж',
      },
      {
        command_id: 112,
        command: 'approveAddyPaymentOnPay',
        description: 'Подтвердить платеж addy на оплату',
      },
      {
        command_id: 116,
        command: 'defineUnknownPayment',
        description: 'Определить платеж',
      },
    ];

    return Promise.all(
      items.map((item) =>
        this.bitrixBotCommandsRepository.createCommand({
          command: item.command,
          commandId: item.command_id,
          description: item.description,
          botId: botId,
          handler: handler,
        }),
      ),
    );
  }
}
