import { Module } from '@nestjs/common';
import { NeuroService } from './services/service';

@Module({
  imports: [
    // ClientsModule.registerAsync([
    //   {
    //     name: MICROSERVICES.NEURO,
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
