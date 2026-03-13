import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from '../../constants/constants';
import { RobotsService } from '@/shared/microservices/modules/robots/services/service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MICROSERVICES.ROBOTS,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          name: MICROSERVICES.ROBOTS,
          options: {
            host: configService.getOrThrow<string>('microservices.robots.host'),
            port: 6379,
            password: configService.getOrThrow<string>('redisConfig.password'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [],
  providers: [RobotsService],
  exports: [RobotsService],
})
export class RobotsModule {}
