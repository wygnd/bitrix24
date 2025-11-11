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
import { BitrixDepartmentService } from '@/modules/bitirx/modules/department/department.service';
import { WikiService } from '@/modules/wiki/wiki.service';
import { BitrixWebhookGuard } from '@/modules/bitirx/guards/bitrix-webhook.guard';
import { IncomingWebhookDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook.dto';

@ApiTags(B24ApiTags.WEBHOOK)
@Controller('webhook')
export class BitrixWebhookController {
  constructor(
    private readonly bitrixWebhookService: BitrixWebhookService,
    private readonly departmentService: BitrixDepartmentService,
    private readonly wikiService: WikiService,
  ) {}

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
}
