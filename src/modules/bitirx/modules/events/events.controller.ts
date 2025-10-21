import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { BitrixMessageService } from '../im/im.service';
import { OnImCommandAddDto } from './events.dto';
import type { B24EventBodyOnInstallApp } from './interfaces/events.interface';
import { REDIS_CLIENT, REDIS_KEYS } from '../../../redis/redis.constants';
import { RedisService } from '../../../redis/redis.service';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { BitrixEventService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class BitrixEventsController {
  constructor(
    private readonly bitrixMessageService: BitrixMessageService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    private readonly bitrixEventService: BitrixEventService,
  ) {}

  @Post('onimcommandadd')
  async handleCommand(@Body() data: OnImCommandAddDto) {
    try {
      return this.bitrixEventService.handleEvent(data);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiExcludeEndpoint()
  @Post('/app/install')
  async installApp(@Body() data: B24EventBodyOnInstallApp) {
    try {
      console.log('Get data on install event: ', data);
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
        auth.expires_in,
      );
      return await this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: 'chat77152',
        MESSAGE: `Установка приложения [b](Node)![/b][br][br]${JSON.stringify(data) ?? ''}`,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
