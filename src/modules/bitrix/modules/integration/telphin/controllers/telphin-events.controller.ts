import { Body, Controller, Post, Query } from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import { ApiTags } from '@nestjs/swagger';

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

  @Post('/calls')
  async handleDialInEventFromTelphin(@Body() body: any, @Query() query: any) {
    this.logger.info(
      {
        message: 'check request',
        body,
        query,
      },
      true,
    );
    return true;
  }
}
