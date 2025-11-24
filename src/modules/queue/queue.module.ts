import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '@/modules/queue/queue.service';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import { QueueBitrixLightConsumer } from '@/modules/queue/consumers/queue-bitrix-light.consumer';

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
      prefix: 'qbitrix',
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [],
  providers: [QueueService, QueueBitrixLightConsumer],
  exports: [QueueService],
})
export class QueueModule {}
