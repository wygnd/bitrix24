import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BitrixTelphinEventsAnswerDto } from '@/modules/bitrix/application/dtos/telphin/telphin-events.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { BitrixTelphinUseCase } from '@/modules/bitrix/application/use-cases/telphin/telphin.use-case';

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

  constructor(private readonly bitrixTelphin: BitrixTelphinUseCase) {}

  @ApiOperation({ summary: 'Обработка входящих звонков с telphin' })
  @HttpCode(HttpStatus.OK)
  @Post('/calls/answer')
  async handleAnswerCallEventFromTelphin(
    @Body() body: BitrixTelphinEventsAnswerDto,
  ) {
    try {
      const response = await this.bitrixTelphin.handleAnswerCall(body);
      this.logger.debug({ body, response });

      return response;
    } catch (error) {
      this.logger.error({ body, error });
      throw error;
    }
  }
}
