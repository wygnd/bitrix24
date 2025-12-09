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
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { BitrixHeadHunterController } from '@/modules/bitirx/modules/integration/headhunter/headhunter.controller';
import { bitrixProviders } from '@/modules/bitirx/bitrix.providers';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { HttpModule } from '@nestjs/axios';
import { BitrixImbotEventsController } from '@/modules/bitirx/modules/imbot/imbot-events.controller';
import { BitrixWebhookController } from '@/modules/bitirx/modules/webhook/webhook.controller';
import { BitrixPlacementService } from '@/modules/bitirx/modules/placement/placement.service';
import { BitrixPlacementController } from '@/modules/bitirx/modules/placement/placement.controller';
import { BitrixHeadHunterService } from '@/modules/bitirx/modules/integration/headhunter/headhunter.service';
import { BitrixBotController } from '@/modules/bitirx/modules/imbot/imbot.controller';
import { BitrixWebhookService } from '@/modules/bitirx/modules/webhook/webhook.service';
import { BitrixDepartmentService } from '@/modules/bitirx/modules/department/department.service';
import { BitrixEventsController } from '@/modules/bitirx/modules/events/events.controller';
import { BitrixEventService } from '@/modules/bitirx/modules/events/event.service';
import { DepartmentController } from '@/modules/bitirx/modules/department/department.controller';
import { BitrixTaskController } from '@/modules/bitirx/modules/task/task.controller';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';
import { WikiModule } from '@/modules/wiki/wiki.module';
import { BitrixWikiController } from '@/modules/bitirx/modules/integration/wiki/wiki.controller';
import { BitrixWikiService } from '@/modules/bitirx/modules/integration/wiki/wiki.service';
import { AvitoModule } from '@/modules/avito/avito.module';
import { BitrixLeadController } from '@/modules/bitirx/modules/lead/lead.controller';
import { BitrixLeadObserveManagerCallingService } from '@/modules/bitirx/modules/lead/services/lead-observe-manager-calling.service';
import { TokensModule } from '@/modules/tokens/tokens.module';
import { BitrixAddySupportService } from '@/modules/bitirx/modules/integration/addy/services/addy-support.service';
import { BitrixAddySupportControllerV1 } from '@/modules/bitirx/modules/integration/addy/controllers/addy-support.controller';
import { BitrixAddyPaymentsControllerV1 } from '@/modules/bitirx/modules/integration/addy/controllers/addy-payments.controller';
import { BitrixAddyPaymentsService } from '@/modules/bitirx/modules/integration/addy/services/addy-payments.service';

@Module({
  imports: [
    HttpModule,
    RedisModule,
    forwardRef(() => HeadHunterModule),
    WikiModule,
    AvitoModule,
    TokensModule,
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
    DepartmentController,
    BitrixEventsController,
    BitrixTaskController,
    BitrixWikiController,
    BitrixLeadController,
    BitrixAddySupportControllerV1,
    BitrixAddyPaymentsControllerV1,
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
  ],
})
export class BitrixModule {}
