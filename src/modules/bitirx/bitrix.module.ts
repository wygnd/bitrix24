import { Module } from '@nestjs/common';
import { BitrixController } from './bitrix.controller';
import { BitrixService } from './bitrix.service';
import { BitrixUserService } from './modules/user/user.service';
import { BitrixLeadService } from './modules/lead/lead.service';
import { BitrixMessageService } from './modules/im/im.service';
import { BitrixImBotService } from './modules/imbot/imbot.service';
import { RedisModule } from '../redis/redis.module';
import { BitrixAvitoController } from './modules/integration/avito/avito.controller';
import { BitrixDealController } from './modules/deal/deal.controller';
import { BitrixDealService } from './modules/deal/deal.service';
import { BitrixEventsController } from './modules/events/events.controller';
import { BitrixEventService } from './modules/events/events.service';
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { BitrixHeadHunterController } from '@/modules/bitirx/modules/integration/headhunter/headhunter.controller';
import { bitrixProviders } from '@/modules/bitirx/bitrix.providers';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, RedisModule, HeadHunterModule],
  controllers: [
    BitrixController,
    BitrixAvitoController,
    BitrixDealController,
    BitrixEventsController,
    BitrixHeadHunterController,
  ],
  providers: [
    ...bitrixProviders,
    BitrixService,
    BitrixUserService,
    BitrixLeadService,
    BitrixMessageService,
    BitrixImBotService,
    BitrixDealService,
    BitrixEventService,
    BitrixIntegrationAvitoService,
  ],
  exports: [BitrixService],
})
export class BitrixModule {}
