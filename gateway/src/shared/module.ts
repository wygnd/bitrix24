import { Module } from '@nestjs/common';
import { MicroservicesModule } from '@/shared/microservices/module';

@Module({
  imports: [MicroservicesModule],
  exports: [MicroservicesModule],
})
export class SharedModule {}
