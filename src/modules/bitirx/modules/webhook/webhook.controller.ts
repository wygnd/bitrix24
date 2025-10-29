import { Body, Controller, Post } from '@nestjs/common';
import { IncomingWebhookDistributeDealDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook-distribute-deal.dto';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';

@ApiTags(B24ApiTags.WEBHOOK)
@Controller('webhook')
export class BitrixWebhookController {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixImbotService: BitrixImBotService,
  ) {}

  @Post('distribute-new-deal')
  async distributeNewDeal(@Body() body: IncomingWebhookDistributeDealDto) {
    await this.bitrixImbotService.sendMessage({
      BOT_ID: this.bitrixService.BOT_ID,
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE: '[b]Обработка исходнящего вебхука:[/b][br][br]' + JSON.stringify(body),
    });
  }
}
