import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GrampusConfig } from '@/common/interfaces/grampus-config.interface';
import { GrampusService } from '@/modules/grampus/grampus.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const grampusConfig =
          configService.getOrThrow<GrampusConfig>('grampusConfig');

        return {
          baseURL: grampusConfig.baseUrl,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        };
      },
    }),
  ],
  providers: [GrampusService],
  exports: [GrampusService],
})
export class GrampusModule {}
