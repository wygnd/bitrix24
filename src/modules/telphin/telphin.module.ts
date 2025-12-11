import { Module } from '@nestjs/common';
import { telphinProviders } from '@/modules/telphin/telphin.providers';

@Module({
  imports: [],
  controllers: [],
  providers: [...telphinProviders],
  exports: [],
})
export class TelphinClientCallCard {}
