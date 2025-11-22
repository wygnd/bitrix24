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
import { QueueModule } from '@/modules/queue/queue.module';
import { WikiModule } from '@/modules/wiki/wiki.module';
import { BitrixWikiController } from '@/modules/bitirx/modules/integration/wiki/wiki.controller';
import { BitrixWikiService } from '@/modules/bitirx/modules/integration/wiki/wiki.service';
import { AvitoModule } from '@/modules/avito/avito.module';

@Module({
  imports: [
    HttpModule,
    RedisModule,
    forwardRef(() => HeadHunterModule),
    QueueModule,
    WikiModule,
    AvitoModule,
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
    BitrixHeadHunterService,
    BitrixWebhookService,
    BitrixDepartmentService,
    BitrixEventService,
    BitrixTaskService,
    BitrixWikiService,
  ],
  exports: [
    BitrixService,
    BitrixMessageService,
    BitrixTaskService,
    BitrixDealService,
    BitrixWebhookService,
  ],
})
export class BitrixModule {}
