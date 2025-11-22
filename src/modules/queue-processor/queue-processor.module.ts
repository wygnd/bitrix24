import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@/modules/queue-processor/queue-processor.constants';
import { QueueProcessorBitrixProcessor } from '@/modules/queue-processor/processors/queue-processor-bitrix.processor';
import { BitrixModule } from '@/modules/bitirx/bitrix.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.QUEUE_BITRIX_EVENTS,
    }),
    BitrixModule,
  ],
  providers: [QueueProcessorBitrixProcessor],
})
export class QueueProcessorModule {}
