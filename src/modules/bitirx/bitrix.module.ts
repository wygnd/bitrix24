import { forwardRef, Module } from '@nestjs/common';
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
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { BitrixHeadHunterController } from '@/modules/bitirx/modules/integration/headhunter/headhunter.controller';
import { bitrixProviders } from '@/modules/bitirx/bitrix.providers';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { HttpModule } from '@nestjs/axios';
import { BitrixImbotController } from '@/modules/bitirx/modules/imbot/imbot.controller';
import { BitrixWebhookController } from '@/modules/bitirx/modules/webhook/webhook.controller';
import { BitrixPlacementService } from '@/modules/bitirx/modules/placement/bitrix-placement.service';
import { BitrixPlacementController } from '@/modules/bitirx/modules/placement/placement.controller';

@Module({
  imports: [HttpModule, RedisModule, forwardRef(() => HeadHunterModule)],
  controllers: [
    BitrixController,
    BitrixAvitoController,
    BitrixDealController,
    BitrixHeadHunterController,
    BitrixImbotController,
    BitrixWebhookController,
    BitrixPlacementController,
  ],
  providers: [
    ...bitrixProviders,
    BitrixService,
    BitrixUserService,
    BitrixLeadService,
    BitrixMessageService,
    BitrixImBotService,
    BitrixDealService,
    BitrixIntegrationAvitoService,
    BitrixPlacementService,
  ],
  exports: [BitrixService, BitrixMessageService],
})
export class BitrixModule {}
