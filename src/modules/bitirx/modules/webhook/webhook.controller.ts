import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncomingWebhookDistributeDealDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook-distribute-deal.dto';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { BitrixWebhookService } from '@/modules/bitirx/modules/webhook/webhook.service';
import { BitrixWebhookGuard } from '@/modules/bitirx/guards/bitrix-webhook.guard';
import { IncomingWebhookDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook.dto';
import { IncomingWebhookApproveSiteForDealDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook-approve-site-for-deal.dto';
import dayjs from 'dayjs';

@ApiTags(B24ApiTags.WEBHOOK)
@Controller('webhook')
export class BitrixWebhookController {
  constructor(private readonly bitrixWebhookService: BitrixWebhookService) {}

  @UseGuards(BitrixWebhookGuard)
  @Post('/bitrix/distribute-new-deal')
  @HttpCode(HttpStatus.OK)
  async distributeNewDeal(
    @Body() body: IncomingWebhookDto,
    @Query() query: IncomingWebhookDistributeDealDto,
  ) {
    return this.bitrixWebhookService.handleIncomingWebhookToDistributeNewDeal(
      query,
    );
  }

  @UseGuards(BitrixWebhookGuard)
  @Post('/bitrix/approve-site-for-advert')
  @HttpCode(HttpStatus.OK)
  async approveSiteDealForAdvert(
    @Body() body: IncomingWebhookDto,
    @Query() query: IncomingWebhookApproveSiteForDealDto,
  ) {
    return this.bitrixWebhookService.handleIncomingWebhookToApproveSiteForAdvert(
      query,
      body.document_id[2],
    );
  }
}
