import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/module';
import { bitrixProviders } from './api/providers/provider';
import { BitrixApiService } from './services/auth/service';
import { B24UseCase } from './api/application/use-cases/use-case';
import { BitrixController } from './controllers/controller';
import { B24IntegrationAddyController } from './api/controllers/addy/controller';
import { B24AddyIntegrationUseCase } from './api/application/use-cases/addy/integration/use-case';

@Module({
  imports: [ConfigModule, HttpModule, RedisModule],
  controllers: [
    // DEFAULT
    BitrixController,

    // ADDY
    B24IntegrationAddyController,
  ],
  providers: [
    // DEFAULT
    BitrixApiService,
    ...bitrixProviders,
    B24UseCase,

    // ADDY
    B24AddyIntegrationUseCase,
  ],
})
export class BitrixModule {}
