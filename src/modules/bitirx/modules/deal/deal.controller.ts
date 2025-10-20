import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BitrixImBotService } from '../imbot/imbot.service';
import { BitrixOutcomingWebhookDto } from '../../dtos/bitrix-outcoming-webhook.dto';
import { BitrixService } from '../../bitrix.service';

@ApiTags('Deals')
@Controller('deals')
export class BitrixDealController {
  constructor(
    private readonly bitrixImbotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
  ) {}

  @Post('notify-about-converted-deal')
  async notifyAboutConvertedSiteDeal(
    @Body() body: BitrixOutcomingWebhookDto,
    @Query('assigned_id') assigned_id: string,
  ) {
    try {
      const [, dealId] = body.document_id[2].split('_');
      const [, userId] = assigned_id.split('_');
      const message =
        '[b]Сайты для кейсов[/b][br][br]' +
        'Разработка сайта завершена![br]Укажи, отвечает ли сайт на требования хотя бы одного из пунктов[br]' +
        '[b]Критерии отбора сайтов для кейсов:[/b][br][br]' +
        '- Яркий, запоминающийся, нетипичный дизайн (не все подряд индивиды, ' +
        'а когда наши дизайнеры прыгнули выше головы и сделали очень крутой дизайн). ' +
        'Если есть сомнения по этому пункту, то всё равно отправляйте Ирине на согласование.[br]' +
        '- Наличие технических особенностей (личные кабинеты, интеграции, наличие анимаций, сложная карточка товара и прочее)[br]' +
        '- ВСЕ сайты на Bitrix (вне зависимости от дизайна и тех.особенностей)[br]' +
        '- ВСЕ индивидуальные сайты Вологодских заказчиков (вне зависимости от дизайна и тех.особенностей)[br]' +
        '- Нетиповые некоммерческие проекты (например, новостной портал).[br]' +
        '- Сайты, которые делали для гос.структур (больницы и прочее)[br][br]' +
        'Сделка: ' +
        this.bitrixService.generateDealUrl(dealId);

      return this.bitrixImbotService.sendMessage({
        BOT_ID: 1264,
        DIALOG_ID: userId,
        MESSAGE: message,
        KEYBOARD: [
          {
            TEXT: 'Сайт подходит',
            COMMAND: 'checkSiteForCase',
            COMMAND_PARAMS: JSON.stringify({
              dealId: dealId,
              isFits: true,
              oldMessage: Buffer.from(message, 'utf8'),
            }),
            BG_COLOR_TOKEN: 'primary',
            DISPLAY: 'LINE',
          },
          {
            TEXT: 'Сайт не подходит',
            COMMAND: 'checkSiteForCase',
            COMMAND_PARAMS: JSON.stringify({
              dealId: dealId,
              isFits: false,
              oldMessage: Buffer.from(message, 'utf8'),
            }),
            BG_COLOR_TOKEN: 'alert',
            DISPLAY: 'LINE',
          },
        ],
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  // @Post('register-command')
  // async registerCommand() {
  //   try {
  //     return await this.bitrixImbotService.addCommand({
  //       BOT_ID: 1264,
  //       COMMAND: 'checkSiteForCase',
  //       EVENT_COMMAND_ADD:
  //         'https://bitrix24-production.up.railway.app/events/onimcommandadd',
  //       LANG: [
  //         {
  //           LANGUAGE_ID: 'ru',
  //           TITLE: 'Проверка сайта для кейса',
  //           PARAMS: '',
  //         },
  //         {
  //           LANGUAGE_ID: 'en',
  //           TITLE: 'Check site case',
  //           PARAMS: '',
  //         },
  //       ],
  //     });
  //   } catch (error) {
  //     throw new HttpException(error, HttpStatus.BAD_REQUEST);
  //   }
  // }
}
