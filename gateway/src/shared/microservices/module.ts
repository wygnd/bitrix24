import { Module } from '@nestjs/common';
import { NeuroModule } from '@/shared/microservices/modules/neuro/module';
import { RobotsModule } from '@/shared/microservices/modules/robots/module';

@Module({
  imports: [NeuroModule, RobotsModule],
  exports: [NeuroModule, RobotsModule],
})
export class MicroservicesModule {}
