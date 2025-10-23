import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { ConfigService } from '@nestjs/config';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';

@ApiTags(B24ApiTags.HEAD_HUNTER)
@Controller('integration/headhunter')
export class BitrixHeadHunterController {
  constructor(
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly configService: ConfigService,
    // private readonly headHunterApi: HeadHunterService,
  ) {}

  @ApiOperation({ summary: 'Handle hh.ru application' })
  @Post('/redirect_uri')
  @HttpCode(HttpStatus.OK)
  async handleApp(@Body() fields: any) {
    console.log('Bro, getting fields from hh.ru: ', fields);
    await this.bitrixImBotService.sendMessage({
      BOT_ID: 1264,
      DIALOG_ID:
        this.configService.get<string>('bitrixConstants.TEST_CHAT_ID') ?? '376',
      MESSAGE:
        '[user=376]Денис Некрасов[/user][br]' +
        'HH ru отправил заапрос на /redirect_uri[br]' +
        JSON.stringify(fields),
    });
    return true;
  }

  @HttpCode(HttpStatus.OK)
  @Post('/webhook')
  async receiveWebhook(@Body() body: any) {
    try {
      return this.bitrixImBotService.sendMessage({
        BOT_ID: 1264,
        DIALOG_ID: 'chat77152',
        MESSAGE:
          '[b]hh.ru[/b][br][user=376]Денис Некрасов[/user][br]Новое уведомление:[br]' + JSON.stringify(body),
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
