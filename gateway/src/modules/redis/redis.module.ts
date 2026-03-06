import { Module } from '@nestjs/common';
import { redisProviders } from './redis.providers';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Module({
  providers: [...redisProviders, RedisService],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
