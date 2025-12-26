import { forwardRef, Module } from '@nestjs/common';
import { BitrixController } from './bitrix.controller';
import { BitrixService } from './bitrix.service';
import { BitrixUserService } from './modules/user/user.service';
import { BitrixLeadService } from './modules/lead/services/lead.service';
import { BitrixMessageService } from './modules/im/im.service';
import { BitrixImBotService } from './modules/imbot/imbot.service';
import { RedisModule } from '../redis/redis.module';
import { BitrixAvitoController } from './modules/integration/avito/avito.controller';
import { BitrixDealController } from './modules/deal/deal.controller';
import { BitrixDealService } from './modules/deal/deal.service';
import { BitrixIntegrationAvitoService } from '@/modules/bitrix/modules/integration/avito/avito.service';
import { BitrixHeadHunterController } from '@/modules/bitrix/modules/integration/headhunter/headhunter.controller';
import { bitrixProviders } from '@/modules/bitrix/bitrix.providers';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { HttpModule } from '@nestjs/axios';
import { BitrixImbotEventsController } from '@/modules/bitrix/modules/imbot/imbot-events.controller';
import { BitrixWebhookController } from '@/modules/bitrix/modules/webhook/webhook.controller';
import { BitrixPlacementService } from '@/modules/bitrix/modules/placement/placement.service';
import { BitrixPlacementController } from '@/modules/bitrix/modules/placement/placement.controller';
import { BitrixHeadHunterService } from '@/modules/bitrix/modules/integration/headhunter/headhunter.service';
import { BitrixBotController } from '@/modules/bitrix/modules/imbot/imbot.controller';
import { BitrixWebhookService } from '@/modules/bitrix/modules/webhook/webhook.service';
import { BitrixDepartmentService } from '@/modules/bitrix/modules/department/department.service';
import { BitrixEventsController } from '@/modules/bitrix/modules/events/events.controller';
import { BitrixEventService } from '@/modules/bitrix/modules/events/event.service';
import { BitrixDepartmentController } from '@/modules/bitrix/modules/department/department.controller';
import { BitrixTaskController } from '@/modules/bitrix/modules/task/task.controller';
import { BitrixTaskService } from '@/modules/bitrix/modules/task/task.service';
import { WikiModule } from '@/modules/wiki/wiki.module';
import { BitrixWikiController } from '@/modules/bitrix/modules/integration/wiki/wiki.controller';
import { BitrixWikiService } from '@/modules/bitrix/modules/integration/wiki/wiki.service';
import { AvitoModule } from '@/modules/avito/avito.module';
import { BitrixLeadController } from '@/modules/bitrix/modules/lead/controllers/lead.controller';
import { BitrixLeadObserveManagerCallingService } from '@/modules/bitrix/modules/lead/services/lead-observe-manager-calling.service';
import { TokensModule } from '@/modules/tokens/tokens.module';
import { BitrixAddySupportService } from '@/modules/bitrix/modules/integration/addy/services/addy-support.service';
import { BitrixAddySupportControllerV1 } from '@/modules/bitrix/modules/integration/addy/controllers/addy-support.controller';
import { BitrixAddyPaymentsControllerV1 } from '@/modules/bitrix/modules/integration/addy/controllers/addy-payments.controller';
import { BitrixAddyPaymentsService } from '@/modules/bitrix/modules/integration/addy/services/addy-payments.service';
import { TelphinModule } from '@/modules/telphin/telphin.module';
import { BitrixLeadUpsellController } from '@/modules/bitrix/modules/lead/controllers/lead-upsells.controller';
import { BitrixLeadUpsellService } from '@/modules/bitrix/modules/lead/services/lead-upsell.service';
import { BitrixMessageControllerV1 } from '@/modules/bitrix/modules/im/im.controller';
import { BitrixTelphinEventsControllerV1 } from '@/modules/bitrix/modules/integration/telphin/controllers/telphin-events.controller';
import { BitrixTelphinEventsService } from '@/modules/bitrix/modules/integration/telphin/services/telphin-events.service';

@Module({
  imports: [
    HttpModule,
    RedisModule,
    forwardRef(() => HeadHunterModule),
    WikiModule,
    AvitoModule,
    TokensModule,
    forwardRef(() => TelphinModule),
  ],
  controllers: [
    BitrixController,
    BitrixAvitoController,
    BitrixDealController,
    BitrixHeadHunterController,
    BitrixBotController,
    BitrixImbotEventsController,
    BitrixWebhookController,
    BitrixPlacementController,
    BitrixDepartmentController,
    BitrixEventsController,
    BitrixTaskController,
    BitrixWikiController,
    BitrixLeadController,
    BitrixLeadUpsellController,
    BitrixAddySupportControllerV1,
    BitrixAddyPaymentsControllerV1,
    BitrixMessageControllerV1,
    BitrixTelphinEventsControllerV1,
  ],
  providers: [
    // providers
    ...bitrixProviders,

    // other services
    BitrixService,

    // USERS
    BitrixUserService,

    // LEADS
    BitrixLeadService,
    BitrixLeadObserveManagerCallingService,
    BitrixLeadUpsellService,

    // MESSAGES AND CHATS
    BitrixMessageService,
    BitrixImBotService,

    // DEALS
    BitrixDealService,

    // TASKS
    BitrixTaskService,

    // INTEGRATIONS
    BitrixIntegrationAvitoService,
    BitrixPlacementService,
    BitrixHeadHunterService,
    BitrixWebhookService,
    BitrixDepartmentService,
    BitrixEventService,
    BitrixWikiService,
    BitrixAddySupportService,
    BitrixAddyPaymentsService,
    BitrixTelphinEventsService,
  ],
  exports: [
    BitrixLeadService,
    BitrixService,
    BitrixMessageService,
    BitrixImBotService,
    BitrixTaskService,
    BitrixDealService,
    BitrixWebhookService,
    BitrixIntegrationAvitoService,
    BitrixHeadHunterService,
    BitrixLeadUpsellService,
  ],
})
export class BitrixModule {}
