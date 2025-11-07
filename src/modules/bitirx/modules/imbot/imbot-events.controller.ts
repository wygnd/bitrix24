import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixMessageService } from '@/modules/bitirx/modules/im/im.service';
import { REDIS_CLIENT, REDIS_KEYS } from '@/modules/redis/redis.constants';
import { RedisService } from '@/modules/redis/redis.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import {
  OnImCommandKeyboardDto,
} from '@/modules/bitirx/modules/imbot/dtos/events.dto';
import {
  ApiExcludeEndpoint,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { B24EventBodyOnInstallApp } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { BitrixBotCommandGuard } from '@/modules/bitirx/guards/bitrix-bot-command.guard';

@ApiTags(B24ApiTags.EVENTS)
@Controller('events')
export class BitrixImbotEventsController {
  constructor(
    private readonly bitrixMessageService: BitrixMessageService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    private readonly bitrixImbotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
  ) {}

  @ApiOperation({
    summary: 'Handle bot commands',
    description: 'Available commands: ',
  })
  @UseGuards(BitrixBotCommandGuard)
  @Post('onimcommandadd')
  async handleCommand(@Body() body: OnImCommandKeyboardDto) {
    const { event, data } = body;

    this.bitrixImbotService.sendMessage({
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE: 'Новая команда боту:[br]' + JSON.stringify(body),
    });

    if (event !== 'ONIMCOMMANDADD')
      throw new ForbiddenException('Invalid event');

    const { MESSAGE } = data.PARAMS;

    const [command] = MESSAGE.split(' ', 2);

    switch (command) {
      case '/distributeNewDeal':
        break;

      default:
        throw new BadRequestException('Command not handled yet');
    }
  }

  @ApiOperation({
    summary: 'Handle bot events',
  })
  @Post('/bot')
  async handleBot(@Body() body: any) {
    console.log(body);
  }

  @ApiExcludeEndpoint()
  @Post('/app/install')
  async installApp(@Body() data: B24EventBodyOnInstallApp) {
    try {
      const { auth } = data;
      Promise.all([
        this.redisService.set<string>(
          REDIS_KEYS.BITRIX_ACCESS_TOKEN,
          auth.access_token,
        ),
        this.redisService.set<string>(
          REDIS_KEYS.BITRIX_REFRESH_TOKEN,
          auth.refresh_token,
        ),
        this.redisService.set<number>(
          REDIS_KEYS.BITRIX_ACCESS_EXPIRES,
          auth.expires,
        ),
      ]).then(() => this.bitrixService.updateTokens());
      return this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
        MESSAGE: `Установка приложения [b](Node)![/b][br][br]${JSON.stringify(data) ?? ''}`,
        SYSTEM: 'Y',
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
