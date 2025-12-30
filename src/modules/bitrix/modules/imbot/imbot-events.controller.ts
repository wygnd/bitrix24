import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { BitrixMessageService } from '@/modules/bitrix/modules/im/im.service';
import { REDIS_CLIENT, REDIS_KEYS } from '@/modules/redis/redis.constants';
import { RedisService } from '@/modules/redis/redis.service';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { B24EventBodyOnInstallApp } from '@/modules/bitrix/modules/imbot/interfaces/imbot-events.interface';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { TokensService } from '@/modules/tokens/tokens.service';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';

@ApiTags(B24ApiTags.EVENTS)
@ApiExceptions()
@Controller('events')
export class BitrixImbotEventsController {
  constructor(
    private readonly bitrixMessageService: BitrixMessageService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    private readonly bitrixService: BitrixService,
    private readonly tokensService: TokensService,
  ) {}

  @ApiOperation({
    summary: 'Handle bot events',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/bot')
  async handleBot(@Body() body: any) {
    try {
      return this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
        MESSAGE: `[b]/events/bot[/b][br]Обработка приложения [b](Node)![/b][br][br]${JSON.stringify(body) ?? ''}`,
        SYSTEM: 'Y',
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  @Post('/app/install')
  async installApp(@Body() data: B24EventBodyOnInstallApp) {
    try {
      const { auth } = data;
      Promise.all([
        this.tokensService.updateOrCreateToken(TokensServices.BITRIX_APP, {
          refreshToken: auth.refresh_token,
          accessToken: auth.access_token,
          expires: auth.expires * 1000,
        }),
        // Old
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
      console.log(error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
