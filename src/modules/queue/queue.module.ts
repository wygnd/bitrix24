import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BitrixSyncProcessor } from './processors/bitrix-sync.processor';

@Module({
  imports: [
    BullModule.forRootAsync({}),
    BullModule.registerQueue(
      { name: 'bitrix.sync' },
      // { name: 'bitrix.events' },
      // { name: 'bitrix.batch' },
    ),
  ],
  providers: [BitrixSyncProcessor],
})
export class QueueModule {}
