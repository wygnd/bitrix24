import { Module } from '@nestjs/common';
import { NeuroModule } from './neuro/module';

@Module({
  imports: [NeuroModule],
  exports: [NeuroModule],
})
export class MicroservicesModule {}
