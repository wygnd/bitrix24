import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BitrixTelphinEventsAnswerDto } from '@/modules/bitrix/modules/integration/telphin/dtos/telphin-events.dto';
import { BitrixTelphinEventsService } from '@/modules/bitrix/modules/integration/telphin/services/telphin-events.service';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';

@ApiTags('Telphin')
@ApiExceptions()
@Controller({
  version: '1',
  path: 'integration/telphin/events',
})
export class BitrixTelphinEventsControllerV1 {
  private readonly logger = new WinstonLogger(
    BitrixTelphinEventsControllerV1.name,
    'bitrix:services:integration:telphin:events'.split(':'),
  );

  constructor(
    private readonly bitrixTelphinEventsService: BitrixTelphinEventsService,
  ) {}

  @ApiOperation({ summary: 'Обработка входящих звонков с telphin' })
  @HttpCode(HttpStatus.OK)
  @Post('/calls/answer')
  async handleAnswerCallEventFromTelphin(
    @Body() body: BitrixTelphinEventsAnswerDto,
  ) {
    try {
      const response =
        await this.bitrixTelphinEventsService.handleAnswerCall(body);
      this.logger.debug({ body, response }, true);

      return response;
    } catch (error) {
      this.logger.error({ body, error }, true);
      throw error;
    }
  }
}
