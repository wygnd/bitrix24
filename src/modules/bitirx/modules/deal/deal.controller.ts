import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BitrixImBotService } from '../imbot/imbot.service';
import { BitrixOutcomingWebhookDto } from '../../dtos/bitrix-outcoming-webhook.dto';
import { BitrixService } from '../../bitrix.service';
import { BitrixDealService } from './deal.service';
import { NotifyAboutConvertedDealDto } from './dtos/notify-about-converted-deal.dto';
import { BitrixMessageService } from '../im/im.service';
import { AuthGuard } from '@/common/guards/auth.guard';

@ApiTags('Deals')
@Controller('deals')
export class BitrixDealController {
  constructor(
    private readonly bitrixImbotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixDealService: BitrixDealService,
    private readonly bitrixMessageService: BitrixMessageService,
  ) {}

  // todo: Notice project manage about ignore message
  // todo: Was added new custom field: UF_CRM_1760972834021 need check this field and notice project manager
  @ApiOperation({
    summary: 'Webhook from bitrix for check site',
    description:
      'When deal translate in <b>CONVERTED</b> status bitrix send webhook with data<br/>' +
      'This endpoint sending message to project manager and Irina Novolockaya with two buttons<br/>' +
      'Project manager check site and choice button<br/>' +
      'If site is fit for our library - backend send message Irina with deal link',
  })
  @Post('notify-about-converted-deal')
  async notifyAboutConvertedSiteDeal(
    @Body() body: BitrixOutcomingWebhookDto,
    @Query() query: NotifyAboutConvertedDealDto,
  ) {
    try {
      const [, dealId] = body.document_id[2].split('_');
      const { assigned_id, ignored } = query;
      const [, userId] = assigned_id.split('_');

      if (ignored)
        return this.bitrixMessageService.sendPrivateMessage({
          DIALOG_ID: '220',
          MESSAGE:
            'Сделка завершена. Менеджер не отметил сайт для кейса[br]Сделка: ' +
            this.bitrixService.generateDealUrl(dealId),
        });

      const message =
        '[b]Сайты для кейсов[/b][br][br]' +
        'Разработка сайта завершена![br]Укажи, отвечает ли сайт на требования хотя бы одного из пунктов[br][br]' +
        '[b]Критерии отбора сайтов для кейсов:[/b][br]' +
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

  @ApiQuery({
    type: Number,
    name: 'deal_id',
    description: 'deal id',
    example: 49146,
    required: true,
  })
  @ApiHeader({
    name: 'Auth',
    description: 'api key',
    example: 'bga token',
    required: true,
  })
  @UseGuards(AuthGuard)
  @Get(':deal_id')
  async getDealById(@Param('deal_id', ParseIntPipe) dealId: number) {
    try {
      return this.bitrixDealService.getDealById(dealId);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
