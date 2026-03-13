import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from '../../constants/constants';
import { RobotsService } from '@/shared/microservices/modules/robots/services/service';

@Module({
  imports: [
    ClientsModule.register([
      {
        transport: Transport.REDIS,
        name: MICROSERVICES.ROBOTS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
    ]),
  ],
  controllers: [],
  providers: [RobotsService],
  exports: [RobotsService],
})
export class RobotsModule {}
