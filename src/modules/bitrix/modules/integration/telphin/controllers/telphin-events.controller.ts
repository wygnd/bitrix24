import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Telphin')
@Controller({
  version: '1',
  path: 'integration/telphin/events',
})
export class BitrixTelphinEventsControllerV1 {
  private readonly logger = new WinstonLogger(
    BitrixTelphinEventsControllerV1.name,
    'bitrix:services:integration:telphin:events'.split(':'),
  );

  constructor() {}

  @ApiOperation({ summary: 'Обработка входящих звонков с telphin' })
  @HttpCode(HttpStatus.OK)
  @Post('/calls/answer')
  async handleAnswerCallEventFromTelphin(
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.info(
      {
        message: 'check request',
        body,
        query,
        headers,
      },
      true,
    );
    return true;
  }
}
