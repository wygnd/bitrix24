import { Body, Controller, Post, Query } from '@nestjs/common';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';

@Controller('telphin')
export class TelphinController {
  constructor(private readonly bitrixImbotService: BitrixImBotService) {}

  @Post('/redirect')
  async handleRedirectUri(
    @Body() fields: any,
    @Query() params: any,
  ): Promise<any> {
    return this.bitrixImbotService.sendTestMessage(
      `[b]Telphin[/b][br]Body: ${JSON.stringify(fields)}[br]Query: ${JSON.stringify(params)}`,
    );
  }
}
