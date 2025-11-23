import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@/modules/queue-processor/queue-processor.constants';
import { BitrixModule } from '@/modules/bitirx/bitrix.module';
import { QueueBitrixEventsListener } from '@/modules/queue-processor/listeners/queue-processor-bitrix-events.listener';

@Module({
  imports: [],
  providers: [QueueBitrixEventsListener],
})
export class QueueProcessorModule {}
