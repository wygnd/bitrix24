import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BitrixBotUseCase } from '@/modules/bitrix/application/use-cases/bot/bot.use-case';

@ApiTags('Telphin')
@Controller('telphin')
export class TelphinController {
  constructor(private readonly bitrixBot: BitrixBotUseCase) {}

  @ApiOperation({
    summary: 'Обработка redirect url',
  })
  @Post('/redirect')
  async handleRedirectUri(
    @Body() fields: any,
    @Query() params: any,
  ): Promise<any> {
    return this.bitrixBot.sendTestMessage(
      `[b]Telphin[/b][br]Body: ${JSON.stringify(fields)}[br]Query: ${JSON.stringify(params)}`,
    );
  }
}
