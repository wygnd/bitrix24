import { Module } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { AppHttpModule } from './modules/http/http.module';
import { BitrixModule } from './modules/bitirx/bitrix.module';
import { ApplicationLoggerModule } from '@/modules/logger/logger.module';

@Module({
  imports: [
    ConfigAppModule,
    RedisModule,
    AppHttpModule,
    BitrixModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
