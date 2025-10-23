import { forwardRef, Module } from '@nestjs/common';
import { BitrixController } from './bitrix.controller';
import { BitrixService } from './bitrix.service';
import { BitrixUserService } from './modules/user/user.service';
import { BitrixLeadService } from './modules/lead/lead.service';
import { BitrixMessageService } from './modules/im/im.service';
import { BitrixImBotService } from './modules/imbot/imbot.service';
import { AppHttpModule } from '../http/http.module';
import { RedisModule } from '../redis/redis.module';
import { BitrixAvitoController } from './modules/integration/avito/avito.controller';
import { BitrixDealController } from './modules/deal/deal.controller';
import { BitrixDealService } from './modules/deal/deal.service';
import { BitrixEventsController } from './modules/events/events.controller';
import { BitrixEventService } from './modules/events/events.service';
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { BitrixHeadHunterController } from '@/modules/bitirx/modules/integration/headhunter/headhunter.controller';

@Module({
  imports: [forwardRef(() => AppHttpModule), RedisModule],
  controllers: [
    BitrixController,
    BitrixAvitoController,
    BitrixDealController,
    BitrixEventsController,
    BitrixHeadHunterController
  ],
  providers: [
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
