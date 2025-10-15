import { Module } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { BitrixModule } from './modules/bitirx/bitrix.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [ConfigAppModule, BitrixModule, RedisModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
