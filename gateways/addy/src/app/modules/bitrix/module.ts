import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/module';
import { bitrixProviders } from './api/providers/provider';
import { BitrixApiService } from './services/auth/service';
import { B24UseCase } from './api/application/use-cases/use-case';
import { BitrixController } from './controllers/controller';

@Module({
  imports: [ConfigModule, HttpModule, RedisModule],
  providers: [
    // default
    BitrixApiService,
    ...bitrixProviders,
    B24UseCase,
  ],
  controllers: [BitrixController],
})
export class BitrixModule {}
