import { forwardRef, Module } from '@nestjs/common';
import { QueueBitrixProcessor } from '@/modules/queue/processors/queue-bitrix.processor';
import { BullModule } from '@nestjs/bullmq';
import { RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import { QueueService } from '@/modules/queue/queue.service';
import { BitrixModule } from '@/modules/bitirx/bitrix.module';

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
      name: QUEUE_NAMES.QUEUE_BITRIX_EVENTS,
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
    forwardRef(() => BitrixModule),
  ],
  controllers: [],
  providers: [QueueBitrixProcessor, QueueService],
  exports: [QueueService],
})
export class QueueModule {}
