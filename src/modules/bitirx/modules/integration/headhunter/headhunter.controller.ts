import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { ConfigService } from '@nestjs/config';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { HeadhunterRedirectDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-redirect.dto';

@ApiTags(B24ApiTags.HEAD_HUNTER)
@Controller('integration/headhunter')
export class BitrixHeadHunterController {
  constructor(
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly configService: ConfigService,
    private readonly headHunterApi: HeadHunterService,
  ) {}

  @ApiOperation({ summary: 'Handle hh.ru application' })
  @Get('/redirect_uri')
  @HttpCode(HttpStatus.OK)
  async handleApp(@Body() fields: any, @Query() query: HeadhunterRedirectDto) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.headHunterApi.HH_CLIENT_ID);
    params.append('client_secret', this.headHunterApi.HH_CLIENT_SECRET);
    params.append('code', query.code);
    const res = await this.headHunterApi.post('/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    await this.bitrixImBotService.sendMessage({
      BOT_ID: 1264,
      DIALOG_ID:
        this.configService.get<string>('bitrixConstants.TEST_CHAT_ID') ?? '376',
      MESSAGE:
        '[user=376]Денис Некрасов[/user][br]' +
        'HH ru отправил заапрос на /redirect_uri[br]' +
        JSON.stringify(fields) +
        '[br]' +
        JSON.stringify(query) +
        '[br]Ответ авторизации: ' +
        JSON.stringify(res),
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
          '[b]hh.ru[/b][br][user=376]Денис Некрасов[/user][br]Новое уведомление:[br]' +
          JSON.stringify(body),
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  // @Post('/create-webhook')
  // async submitWebhook() {
  //   try {
  //     return this.headHunterApi.post('/', {
  //       actions: [
  //         {
  //           settings: {},
  //           type: 'NEW_RESPONSE_OR_INVITATION_VACANCY',
  //         },
  //       ],
  //       url: 'https://bitrix24-production.up.railway.app/integration/headhunter/webhook',
  //     });
  //   } catch (error) {
  //     throw new HttpException(error, HttpStatus.BAD_REQUEST);
  //   }
  // }
}
