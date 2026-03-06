import { Module } from '@nestjs/common';
import { NeuroService } from './services/service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from '@/constants/constants';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // ClientsModule.registerAsync([
    //   {
    //     name: MICROSERVICES.USERS,
    //     useFactory: (configService: ConfigService) => ({
    //       transport: Transport.TCP,
    //       options: {
    //         port: parseInt(
    //           configService.getOrThrow('microservices.users.port'),
    //         ),
    //       },
    //     }),
    //     inject: [ConfigService],
    //   },
    // ]),
  ],
  providers: [NeuroService],
  exports: [NeuroService],
})
export class NeuroModule {}
