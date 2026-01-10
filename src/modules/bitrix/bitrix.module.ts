import { forwardRef, Module } from '@nestjs/common';
import { BitrixController } from './bitrix.controller';
import { BitrixApiService } from './bitrix-api.service';
import { BitrixUserService } from './modules/user/user.service';
import { BitrixLeadService } from './modules/lead/services/lead.service';
import { BitrixImBotService } from './modules/imbot/imbot.service';
import { RedisModule } from '../redis/redis.module';
import { BitrixAvitoController } from './modules/integration/avito/avito.controller';
import { BitrixIntegrationAvitoService } from '@/modules/bitrix/modules/integration/avito/avito.service';
import { BitrixHeadHunterController } from '@/modules/bitrix/modules/integration/headhunter/headhunter.controller';
import { bitrixProviders } from '@/modules/bitrix/providers/bitrix.providers';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { HttpModule } from '@nestjs/axios';
import { BitrixImbotEventsController } from '@/modules/bitrix/modules/imbot/imbot-events.controller';
import { BitrixWebhookController } from '@/modules/bitrix/modules/webhook/webhook.controller';
import { BitrixPlacementService } from '@/modules/bitrix/modules/placement/placement.service';
import { BitrixPlacementController } from '@/modules/bitrix/modules/placement/placement.controller';
import { BitrixHeadHunterService } from '@/modules/bitrix/modules/integration/headhunter/headhunter.service';
import { BitrixBotController } from '@/modules/bitrix/modules/imbot/imbot.controller';
import { BitrixWebhookService } from '@/modules/bitrix/modules/webhook/webhook.service';
import { BitrixEventsController } from '@/modules/bitrix/controllers/events/events.controller';
import { BitrixDepartmentController } from '@/modules/bitrix/controllers/departments/departments.controller';
import { BitrixTaskController } from '@/modules/bitrix/controllers/tasks/tasks.controller';
import { WikiModule } from '@/modules/wiki/wiki.module';
import { BitrixWikiController } from '@/modules/bitrix/modules/integration/wiki/controllers/wiki.controller';
import { BitrixWikiService } from '@/modules/bitrix/modules/integration/wiki/services/wiki.service';
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
import { BitrixMessageControllerV1 } from '@/modules/bitrix/controllers/messages/messages.controller';
import { BitrixTelphinEventsControllerV1 } from '@/modules/bitrix/modules/integration/telphin/controllers/telphin-events.controller';
import { BitrixTelphinEventsService } from '@/modules/bitrix/modules/integration/telphin/services/telphin-events.service';
import { B24WikiClientPaymentsService } from '@/modules/bitrix/modules/integration/wiki/services/wiki-client-payments.service';
import { bitrixDealProviders } from '@/modules/bitrix/providers/deal.providers';
import { bitrixLeadProviders } from './modules/lead/lead.providers';
import { bitrixWikiProviders } from '@/modules/bitrix/modules/integration/wiki/wiki.providers';
import { BitrixDealsUseCase } from '@/modules/bitrix/application/use-cases/deals/deals.use-case';
import { BitrixDealsController } from '@/modules/bitrix/controllers/deals/deals.controller';
import { departmentProviders } from '@/modules/bitrix/providers/department.providers';
import { BitrixDepartmentsUseCase } from '@/modules/bitrix/application/use-cases/departments/departments.use-case';
import { taskProviders } from '@/modules/bitrix/providers/task.providers';
import { BitrixDealsAdapter } from '@/modules/bitrix/infrastructure/deals/deals.adapter';
import { BitrixTasksUseCase } from '@/modules/bitrix/application/use-cases/tasks/tasks.use-case';
import { BitrixEventsUseCase } from '@/modules/bitrix/application/use-cases/events/events.use-case';
import { messageProviders } from '@/modules/bitrix/providers/messages.provider';
import { BitrixMessagesUseCase } from '@/modules/bitrix/application/use-cases/messages/messages.use-case';
import { botProviders } from '@/modules/bitrix/providers/bot.providers';
import { BitrixBotUseCase } from '@/modules/bitrix/application/use-cases/bot/bot.use-case';
import { eventProviders } from '@/modules/bitrix/providers/event.providers';

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

    // DEALS
    BitrixDealsController,

    // DEPARTMENTS
    BitrixDepartmentController,

    // TASKS
    BitrixTaskController,

    // EVENTS
    BitrixEventsController,

    // MESSAGES
    BitrixMessageControllerV1,

    // BOT
    BitrixBotController,

    BitrixAvitoController,
    BitrixHeadHunterController,
    BitrixImbotEventsController,
    BitrixWebhookController,
    BitrixPlacementController,
    BitrixWikiController,
    BitrixLeadController,
    BitrixLeadUpsellController,
    BitrixAddySupportControllerV1,
    BitrixAddyPaymentsControllerV1,
    BitrixTelphinEventsControllerV1,
  ],
  providers: [
    // providers
    ...bitrixProviders,

    // other services
    BitrixApiService,

    // USERS
    BitrixUserService,

    // LEADS
    BitrixLeadService,
    BitrixLeadObserveManagerCallingService,
    BitrixLeadUpsellService,
    ...bitrixLeadProviders,

    // DEALS
    ...bitrixDealProviders,
    BitrixDealsUseCase,

    // DEPARTMENTS
    ...departmentProviders,
    BitrixDepartmentsUseCase,

    // TASKS
    ...taskProviders,
    BitrixTasksUseCase,

    // EVENTS
    ...eventProviders,
    BitrixEventsUseCase,

    // MESSAGES
    ...messageProviders,
    BitrixMessagesUseCase,

    // BOT
    ...botProviders,
    BitrixBotUseCase,

    // WIKI
    ...bitrixWikiProviders,

    // OTHER
    BitrixIntegrationAvitoService,
    BitrixPlacementService,
    BitrixHeadHunterService,
    BitrixWebhookService,
    BitrixWikiService,
    B24WikiClientPaymentsService,
    BitrixAddySupportService,
    BitrixAddyPaymentsService,
    BitrixTelphinEventsService,
  ],
  exports: [
    BitrixApiService,

    // DEALS
    BitrixDealsAdapter,

    // TASKS
    BitrixTasksUseCase,

    // MESSAGES
    BitrixMessagesUseCase,

    BitrixLeadService,
    BitrixImBotService,
    BitrixWebhookService,
    BitrixIntegrationAvitoService,
    BitrixHeadHunterService,
    BitrixLeadUpsellService,
    B24WikiClientPaymentsService,
  ],
})
export class BitrixModule {}
