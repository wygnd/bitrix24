import { Module } from '@nestjs/common';
import { bitrixProviders } from './bitrix.providers';
import { BitrixController } from './bitrix.controller';
import { BitrixService } from './bitrix.service';
import { BitrixUserService } from './methods/user/user.service';
import { BitrixLeadService } from './methods/lead/lead.service';

@Module({
  controllers: [BitrixController],
  providers: [
    ...bitrixProviders,
    BitrixService,
    BitrixUserService,
    BitrixLeadService,
  ],
})
export class BitrixModule {}
