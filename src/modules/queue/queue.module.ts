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
import { WikiModule } from '@/modules/wiki/wiki.module';
import { QueueHeavyService } from '@/modules/queue/queue-heavy.service';
import { QueueBitrixHeavyProcessor } from '@/modules/queue/processors/queue-bitrix-heavy.processor';

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
    WikiModule,
  ],
  controllers: [],
  providers: [
    QueueLightService,
    QueueMiddleService,
    QueueHeavyService,
    QueueBitrixLightProcessor,
    QueueBitrixMiddleProcessor,
    QueueBitrixHeavyProcessor,
  ],
  exports: [QueueLightService, QueueMiddleService, QueueHeavyService],
})
export class QueueModule {}
