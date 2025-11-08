import {
  Body,
  Controller,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncomingWebhookDistributeDealDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook-distribute-deal.dto';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { IncomingWebhookDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook.dto';
import { BitrixWebhookGuard } from '@/modules/bitirx/guards/bitrix-webhook.guard';

@ApiTags(B24ApiTags.WEBHOOK)
@Controller('webhook')
export class BitrixWebhookController {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixImbotService: BitrixImBotService,
  ) {}

  // @UseGuards(BitrixWebhookGuard)
  @Post('distribute-new-deal')
  async distributeNewDeal(
    @Body() body: IncomingWebhookDto,
    @Query() query: IncomingWebhookDistributeDealDto,
  ) {
    await this.bitrixImbotService.sendMessage({
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE:
        '[b]Обработка исходнящего вебхука:[/b][br][br]' +
        [JSON.stringify(body), JSON.stringify(query)].join('[br][br]'),
    });
  }
}
