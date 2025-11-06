import { Module } from '@nestjs/common';
import { QueueProcessor } from '@/modules/queue/processors/queue.processor';
import { BullModule } from '@nestjs/bullmq';
import { RedisOptions } from 'ioredis';
import { QueueController } from '@/modules/queue/queue.controller';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import { QueueService } from '@/modules/queue/queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config = configService.get<RedisOptions>('redisConfig');

        if (!config)
          throw new Error('Invalid redis config. Unable active Queue Module');

        return {
          connection: config,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.QUEUE_BITRIX_SYNC,
    }),
  ],
  controllers: [QueueController],
  providers: [QueueProcessor, QueueService],
  exports: [QueueService],
})
export class QueueModule {}
