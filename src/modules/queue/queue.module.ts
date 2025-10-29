import { Module } from '@nestjs/common';
import { RedisModule } from '@/modules/redis/redis.module';
import { BitrixSyncProcessor } from '@/modules/queue/processors/bitrix-sync.processor';
import { BullModule } from '@nestjs/bull';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/modules/redis/redis.constants';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (redisClient: Redis) => ({
        createClient: () => redisClient,
      }),
      inject: [{ token: REDIS_CLIENT, optional: false }],
      imports: [RedisModule],
    }),
    BullModule.registerQueueAsync({ name: 'bitrix_sync' }),
  ],
  providers: [BitrixSyncProcessor],
  exports: [],
})
export class QueueModule {}
