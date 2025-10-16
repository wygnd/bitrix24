import { Module } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { AppHttpModule } from './modules/http/http.module';

@Module({
  imports: [ConfigAppModule, RedisModule, AppHttpModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
