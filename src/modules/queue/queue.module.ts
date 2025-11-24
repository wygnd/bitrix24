import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import { QUEUE_NAMES } from '@/modules/queue/queue.constants';
import { QueueBitrixLightProcessor } from '@/modules/queue/processors/queue-bitrix-light.processor';
import { BitrixModule } from '@/modules/bitirx/bitrix.module';
import { QueueBitrixMiddleProcessor } from '@/modules/queue/processors/queue-bitrix-middle.processor';
import { QueueMiddleService } from '@/modules/queue/queue-middle.service';

@Global()
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
    BullModule.registerQueue({
      name: QUEUE_NAMES.QUEUE_BITRIX_MIDDLE,
      prefix: 'qbitrix',
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.QUEUE_BITRIX_HEAVY,
      prefix: 'qbitrix',
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
    BitrixModule,
  ],
  controllers: [],
  providers: [
    QueueLightService,
    QueueMiddleService,
    QueueBitrixLightProcessor,
    QueueBitrixMiddleProcessor,
  ],
  exports: [QueueLightService, QueueMiddleService],
})
export class QueueModule {}
