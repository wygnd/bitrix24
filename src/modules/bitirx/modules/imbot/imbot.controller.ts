import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { BitrixMessageService } from '@/modules/bitirx/modules/im/im.service';
import { REDIS_CLIENT, REDIS_KEYS } from '@/modules/redis/redis.constants';
import { RedisService } from '@/modules/redis/redis.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import {
  OnImCommandAddDto,
  OnImCommandKeyboardDto,
} from '@/modules/bitirx/modules/imbot/dtos/events.dto';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { B24EventBodyOnInstallApp } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';

@ApiTags(B24ApiTags.EVENTS)
@Controller('events')
export class BitrixImbotController {
  constructor(
    private readonly bitrixMessageService: BitrixMessageService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    private readonly bitrixImbotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
  ) {}

  @Post('onimcommandadd')
  async handleCommand(@Body() body: OnImCommandKeyboardDto) {
    const { event, data } = body;

    if (event !== 'ONIMCOMMANDADD') throw new Error('Invalid event');

    const { MESSAGE } = data.PARAMS;

    const [command] = MESSAGE.split(' ', 2);

    switch (command) {
      case '/choiceManagerForNewDeal':
        break;

      case '/recievePayment':
        break;

      case '/coordinationAdvert':
        break;

      case '/conrolAiCreatedLead':
        break;

      case '/checkSiteForCase':
        return this.bitrixImbotService.notifyAboutConvertedDeal(body);

      default:
        throw new BadRequestException('Command not handled yet');
    }
  }

  @ApiExcludeEndpoint()
  @Post('/app/install')
  async installApp(@Body() data: B24EventBodyOnInstallApp) {
    try {
      console.log('Getting new tokens, try update');
      const { auth } = data;
      await this.redisService.set<string>(
        REDIS_KEYS.BITRIX_ACCESS_TOKEN,
        auth.access_token,
      );
      await this.redisService.set<string>(
        REDIS_KEYS.BITRIX_REFRESH_TOKEN,
        auth.refresh_token,
      );
      await this.redisService.set<number>(
        REDIS_KEYS.BITRIX_ACCESS_EXPIRES,
        auth.expires,
      );
      await this.bitrixService.updateTokens();
      return await this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: 'chat77152',
        MESSAGE: `Установка приложения [b](Node)![/b][br][br]${JSON.stringify(data) ?? ''}`,
        SYSTEM: 'Y',
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
