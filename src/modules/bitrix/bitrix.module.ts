import { forwardRef, Module } from '@nestjs/common';
import { BitrixController } from './bitrix.controller';
import { RedisModule } from '../redis/redis.module';
import { BitrixAvitoController } from './controllers/avito/avito.controller';
import { BitrixHeadHunterController } from '@/modules/bitrix/controllers/headhunter/headhunter.controller';
import { bitrixProviders } from '@/modules/bitrix/providers/bitrix.providers';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { HttpModule } from '@nestjs/axios';
import { BitrixImbotEventsController } from '@/modules/bitrix/controllers/bot/imbot-events.controller';
import { BitrixWebhookController } from '@/modules/bitrix/controllers/webhooks/webhook.controller';
import { BitrixPlacementController } from '@/modules/bitrix/controllers/placements/placement.controller';
import { BitrixBotController } from '@/modules/bitrix/controllers/bot/imbot.controller';
import { BitrixEventsController } from '@/modules/bitrix/controllers/events/events.controller';
import { BitrixDepartmentController } from '@/modules/bitrix/controllers/departments/departments.controller';
import { BitrixTaskController } from '@/modules/bitrix/controllers/tasks/tasks.controller';
import { WikiModule } from '@/modules/wiki/wiki.module';
import { BitrixWikiController } from '@/modules/bitrix/controllers/wiki/wiki.controller';
import { AvitoModule } from '@/modules/avito/avito.module';
import { BitrixLeadController } from '@/modules/bitrix/controllers/leads/lead.controller';
import { TokensModule } from '@/modules/tokens/tokens.module';
import { BitrixAddySupportControllerV1 } from '@/modules/bitrix/controllers/addy/addy-support.controller';
import { BitrixAddyPaymentsControllerV1 } from '@/modules/bitrix/controllers/addy/addy-payments.controller';
import { TelphinModule } from '@/modules/telphin/telphin.module';
import { BitrixLeadUpsellController } from '@/modules/bitrix/controllers/leads/lead-upsells.controller';
import { BitrixMessageControllerV1 } from '@/modules/bitrix/controllers/messages/messages.controller';
import { BitrixTelphinEventsControllerV1 } from '@/modules/bitrix/controllers/telphin/telphin-events.controller';
import { bitrixDealProviders } from '@/modules/bitrix/providers/deal.providers';
import { BitrixDealsUseCase } from '@/modules/bitrix/application/use-cases/deals/deals.use-case';
import { BitrixDealsController } from '@/modules/bitrix/controllers/deals/deals.controller';
import { departmentProviders } from '@/modules/bitrix/providers/department.providers';
import { BitrixDepartmentsUseCase } from '@/modules/bitrix/application/use-cases/departments/departments.use-case';
import { taskProviders } from '@/modules/bitrix/providers/task.providers';
import { BitrixTasksUseCase } from '@/modules/bitrix/application/use-cases/tasks/tasks.use-case';
import { BitrixEventsUseCase } from '@/modules/bitrix/application/use-cases/events/events.use-case';
import { messageProviders } from '@/modules/bitrix/providers/messages.provider';
import { BitrixMessagesUseCase } from '@/modules/bitrix/application/use-cases/messages/messages.use-case';
import { botProviders } from '@/modules/bitrix/providers/bot.providers';
import { eventProviders } from '@/modules/bitrix/providers/event.providers';
import { BitrixBotUseCase } from '@/modules/bitrix/application/use-cases/bot/bot.use-case';
import { userProviders } from '@/modules/bitrix/providers/user.providers';
import { leadProviders } from '@/modules/bitrix/providers/lead.providers';
import { BitrixLeadsUseCase } from '@/modules/bitrix/application/use-cases/leads/leads.use-case';
import { BitrixLeadsUpsellUseCase } from '@/modules/bitrix/application/use-cases/leads/leads-upsell.use-case';
import { BitrixWebhooksUseCase } from '@/modules/bitrix/application/use-cases/webhooks/webhooks.use-case';
import { placementProviders } from '@/modules/bitrix/providers/placement.providers';
import { BitrixPlacementsUseCase } from '@/modules/bitrix/application/use-cases/placements/placements.use-case';
import { BitrixAddyPaymentsUseCase } from '@/modules/bitrix/application/use-cases/addy/addy-paymnets.use-case';
import { BitrixAddySupportUseCase } from '@/modules/bitrix/application/use-cases/addy/addy-support.use-case';
import { BitrixAvitoUseCase } from '@/modules/bitrix/application/use-cases/avito/avito.use-case';
import { BitrixHeadhunterUseCase } from '@/modules/bitrix/application/use-cases/headhunter/headhunter.use-case';
import { BitrixTelphinUseCase } from '@/modules/bitrix/application/use-cases/telphin/telphin.use-case';
import { wikiProviders } from '@/modules/bitrix/providers/wiki.providers';
import { BitrixWikiClientPaymentsUseCase } from '@/modules/bitrix/application/use-cases/wiki/wiki-client-payments.use-case';
import { BitrixWikiUseCase } from '@/modules/bitrix/application/use-cases/wiki/wiki.use-case';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import { headhunterProviders } from '@/modules/bitrix/providers/headhunter.providers';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeadObserveManagerCallingModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-observe-manager-calling.entity';
import { LeadUpsellModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-upsell.entity';
import { B24WikiClientPaymentsModel } from '@/modules/bitrix/infrastructure/database/entities/wiki/wiki-client-payments.entity';
import { BitrixHeadhunterVacancyModel } from '@/modules/bitrix/infrastructure/database/entities/headhunter/headhunter-vacancy.entity';

@Module({
  imports: [
    HttpModule,
    RedisModule,
    forwardRef(() => HeadHunterModule),
    WikiModule,
    AvitoModule,
    TokensModule,
    forwardRef(() => TelphinModule),
    SequelizeModule.forFeature([
      LeadUpsellModel,
      LeadObserveManagerCallingModel,
      B24WikiClientPaymentsModel,
      BitrixHeadhunterVacancyModel,
    ]),
  ],
  controllers: [
    BitrixController,

    // LEADS
    BitrixLeadController,
    BitrixLeadUpsellController,

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
    BitrixImbotEventsController,

    // WEBHOOKS
    BitrixWebhookController,

    // PLACEMENT
    BitrixPlacementController,

    // ADDY
    BitrixAddySupportControllerV1,
    BitrixAddyPaymentsControllerV1,

    // AVTIO
    BitrixAvitoController,

    // HEADHUNTER
    BitrixHeadHunterController,

    // TELPHIN
    BitrixTelphinEventsControllerV1,

    // WIKI
    BitrixWikiController,
  ],
  providers: [
    // providers
    ...bitrixProviders,
    BitrixUseCase,
    BitrixApiService,

    // LEADS
    ...leadProviders,
    BitrixLeadsUseCase,
    BitrixLeadsUpsellUseCase,

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

    // USERS
    ...userProviders,

    // WEBHOOKS
    BitrixWebhooksUseCase,

    // PLACEMENTS
    ...placementProviders,
    BitrixPlacementsUseCase,

    // ADDY
    BitrixAddySupportUseCase,
    BitrixAddyPaymentsUseCase,

    // AVITO
    BitrixAvitoUseCase,

    // HEADHUNTER
    ...headhunterProviders,
    BitrixHeadhunterUseCase,

    // TELPHIN
    BitrixTelphinUseCase,

    // WIKI
    ...wikiProviders,
    BitrixWikiUseCase,
    BitrixWikiClientPaymentsUseCase,
  ],
  exports: [
    BitrixUseCase,

    // LEADS
    BitrixLeadsUseCase,
    BitrixLeadsUpsellUseCase,

    // DEALS
    BitrixDealsUseCase,

    // TASKS
    BitrixTasksUseCase,

    // MESSAGES
    BitrixMessagesUseCase,

    // BOT
    BitrixBotUseCase,

    // WEBHOOKS
    BitrixWebhooksUseCase,

    // AVITO
    BitrixAvitoUseCase,

    // HEADHUNTER
    BitrixHeadhunterUseCase,

    // WIKI
    BitrixWikiClientPaymentsUseCase,
  ],
})
export class BitrixModule {}
