import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncomingWebhookDistributeDealDto } from '@/modules/bitrix/modules/webhook/dtos/incoming-webhook-distribute-deal.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { BitrixWebhookService } from '@/modules/bitrix/modules/webhook/webhook.service';
import { BitrixWebhookGuard } from '@/modules/bitrix/guards/bitrix-webhook.guard';
import { IncomingWebhookDto } from '@/modules/bitrix/modules/webhook/dtos/incoming-webhook.dto';
import { IncomingWebhookApproveSiteForDealDto } from '@/modules/bitrix/modules/webhook/dtos/incoming-webhook-approve-site-for-deal.dto';
import { IncomingWebhookApproveSiteForCase } from '@/modules/bitrix/modules/webhook/dtos/incoming-webhook-approve-site-for-case.dto';
import { BitrixVoxImplantInitCallEventGuard } from '@/modules/bitrix/guards/bitrix-webhook-voximplant.guard';
import { B24EventVoxImplantCallInitDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-init.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { B24EventVoxImplantCallStartDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-start.dto';

@ApiTags(B24ApiTags.WEBHOOK)
@Controller('webhook')
export class BitrixWebhookController {
  private readonly logger = new WinstonLogger(
    BitrixWebhookController.name,
    'bitrix:telephony'.split(':'),
  );

  constructor(private readonly bitrixWebhookService: BitrixWebhookService) {}

  @UseGuards(BitrixWebhookGuard)
  @Post('/bitrix/distribute-new-deal')
  @HttpCode(HttpStatus.ACCEPTED)
  async distributeNewDeal(
    @Body() body: IncomingWebhookDto,
    @Query() query: IncomingWebhookDistributeDealDto,
  ) {
    this.bitrixWebhookService.handleIncomingWebhookToDistributeNewDeal(query);
    return true;
  }

  @ApiOperation({
    summary: 'Вебхук из битрикса для согласования сайта для РК',
    description:
      'Битрикс отправляет исходящий вебхук.<br>Сервис отправляет сообщение в указанный чат и обрабатывает нажатие кнопок<br>Обработка кнопок в одном едтпоинте: <strong>/bot/onimcommandadd</strong>',
  })
  @UseGuards(BitrixWebhookGuard)
  @Post('/bitrix/approve-site-for-advert')
  @HttpCode(HttpStatus.ACCEPTED)
  async approveSiteDealForAdvert(
    @Body() body: IncomingWebhookDto,
    @Query() query: IncomingWebhookApproveSiteForDealDto,
  ) {
    this.bitrixWebhookService.handleIncomingWebhookToApproveSiteForAdvert(
      query,
      body.document_id[2],
    );

    return true;
  }

  @ApiOperation({
    summary: 'Вебхук из битрикса для определения подходит ли сайт для кейса',
    description:
      'Битрикс отправляет исходящий вебхук.<br>Сервис отправляет сообщение в указанный чат и обрабатывает нажатие кнопок<br>Обработка кнопок в одном едтпоинте: <strong>/bot/onimcommandadd</strong>',
  })
  @UseGuards(BitrixWebhookGuard)
  @Post('/bitrix/approve-site-for-case')
  @HttpCode(HttpStatus.ACCEPTED)
  async approveConvertedSiteDealForCase(
    @Body() body: IncomingWebhookDto,
    @Query() query: IncomingWebhookApproveSiteForCase,
  ) {
    this.bitrixWebhookService.handleIncomingWebhookToApproveSiteForCase(
      query,
      body.document_id[2],
    );
    return true;
  }

  @ApiOperation({ summary: 'Обработка инициализации звонка' })
  @UseGuards(BitrixVoxImplantInitCallEventGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/bitrix/voximplant/call/init')
  async handleWebhookVoxImplantInitCallingFromBitrix(
    @Body() body: B24EventVoxImplantCallInitDto,
  ) {
    try {
      const response =
        await this.bitrixWebhookService.handleVoxImplantCallInit(body);
      this.logger.info(response);
      return response;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Post('/bitrix/voximplant/call/start')
  async handleWebhookVoxImplantStartCallingFromBitrix(
    @Body() body: B24EventVoxImplantCallStartDto,
  ) {
    return this.bitrixWebhookService.handleVoxImplantCallStartTask(body);
  }
}
