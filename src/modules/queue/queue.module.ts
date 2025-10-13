import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'bullmq';
import { BitrixSyncProcessor } from './processors/bitrix-sync.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<RedisOptions>('redisConfig');

        if (!config) throw new Error('Invalid redis config');

        const { url } = config;

        return {
          connection: {
            url: url,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: 'bitrix.sync' },
      // { name: 'bitrix.events' },
      // { name: 'bitrix.batch' },
    ),
  ],
  providers: [BitrixSyncProcessor],
})
export class QueueModule {}
