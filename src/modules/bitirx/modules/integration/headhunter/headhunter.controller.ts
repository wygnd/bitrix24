import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { BitrixMessageService } from '@/modules/bitirx/modules/im/im.service';
import { ConfigService } from '@nestjs/config';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';

@ApiTags(B24ApiTags.HEAD_HUNTER)
@Controller('integration/headhunter')
export class BitrixHeadHunterController {
  constructor(
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Handle hh.ru application' })
  @Post('/redirect_uri')
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
}
