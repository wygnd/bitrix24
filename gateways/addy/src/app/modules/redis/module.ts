import { Module } from '@nestjs/common';
import { redisProviders } from './providers/providers';
import { REDIS_CLIENT } from './constants/constants';
import { RedisService } from './services/service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [...redisProviders, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
