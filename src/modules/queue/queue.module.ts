import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '@/modules/queue/queue.service';
import { QUEUE_NAMES } from '@/modules/queue-processor/queue-processor.constants';

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
      name: QUEUE_NAMES.QUEUE_BITRIX_LIGHT,
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
