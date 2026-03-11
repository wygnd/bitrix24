import { Module } from '@nestjs/common';
import { AvitoApiService } from '@/modules/avito/avito-api.service';
import { AvitoService } from '@/modules/avito/avito.service';
import { AvitoConfig } from '@/common/interfaces/avito-config.interface';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { baseUrl } =
          configService.getOrThrow<AvitoConfig>('avitoConfig');

        return {
          baseURL: baseUrl,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        };
      },
    }),
  ],
  providers: [AvitoApiService, AvitoService],
  exports: [AvitoService],
})
export class AvitoModule {}
