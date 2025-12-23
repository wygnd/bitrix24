import { Body, Controller, Post, Query } from '@nestjs/common';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Telphin')
@Controller('telphin')
export class TelphinController {
  constructor(private readonly bitrixImbotService: BitrixImBotService) {}

  @ApiOperation({
    summary: 'Обработка redirect url',
  })
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
