import { Module } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { BitrixModule } from './modules/bitirx/bitrix.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [ConfigAppModule, BitrixModule, QueueModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
