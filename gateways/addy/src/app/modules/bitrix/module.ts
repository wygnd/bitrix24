import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/module';
import { bitrixProviders } from './api/application/providers/provider';
import { BitrixApiService } from './services/auth/service';
import { BitrixController } from './controllers/controller';
import { bitrixLeadsProviders } from './api/application/providers/leads/provider';
import { B24IntegrationAddyClientsEventsController } from './api/presetation/controllers/addy/clients/events/controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { B24AddyClientsModel } from './api/infrastructure/persistence/models/addy/clients/model';
import { CqrsModule } from '@nestjs/cqrs';
import { bitrixAddyProviders } from './api/application/providers/addy/provider';
import { B24IntegrationAddyClientsContractsController } from './api/presetation/controllers/addy/clients/contracts/controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    RedisModule,
    SequelizeModule.forFeature([B24AddyClientsModel]),
    CqrsModule.forRoot(),
  ],
  controllers: [
    // DEFAULT
    BitrixController,

    // ADDY
    B24IntegrationAddyClientsEventsController,
    B24IntegrationAddyClientsContractsController,
  ],
  providers: [
    // DEFAULT
    BitrixApiService,
    ...bitrixProviders,

    // LEADS
    ...bitrixLeadsProviders,

    // ADDY
    ...bitrixAddyProviders,
  ],
})
export class BitrixModule {}
