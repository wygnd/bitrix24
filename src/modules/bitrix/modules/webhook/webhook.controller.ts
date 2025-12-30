import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotAcceptableException,
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
import {
  BitrixVoxImplantFinishCallEventGuard,
  BitrixVoxImplantInitCallEventGuard,
} from '@/modules/bitrix/guards/bitrix-webhook-voximplant.guard';
import { B24EventVoxImplantCallInitDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-init.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { B24EventVoxImplantCallEndDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-end.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';

@ApiTags(B24ApiTags.WEBHOOK)
@ApiExceptions()
@Controller('webhook')
export class BitrixWebhookController {
  private readonly logger = new WinstonLogger(
    BitrixWebhookController.name,
    'bitrix:services:webhook'.split(':'),
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
    this.logger.debug(
      {
        message: 'approve site for advert',
        body,
        query,
      },
      true,
    );
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
    this.logger.debug(
      {
        message: 'approve site for case',
        body,
        query,
      },
      true,
    );
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
    this.logger.debug(
      {
        message: 'init call',
        body,
      },
      true,
    );
    return this.bitrixWebhookService.handleVoxImplantCallInitTask(body);
  }

  @ApiOperation({ summary: 'Обработка начала звонка' })
  @UseGuards(BitrixVoxImplantFinishCallEventGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/bitrix/voximplant/call/end')
  async handleWebhookVoxImplantEndCallingFromBitrix(
    @Body() body: B24EventVoxImplantCallEndDto,
  ) {
    this.logger.debug(
      {
        message: 'start call',
        body,
      },
      true,
    );

    throw new NotAcceptableException();
    // return this.bitrixWebhookService.handleVoxImplantCallEnd(body);
  }
}
