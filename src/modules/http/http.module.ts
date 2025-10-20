import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BitrixConfig } from '../../common/interfaces/bitrix-config.interface';
import { AppHttpService } from './http.service';
import { httpProviders } from './http.providers';
import { BitrixModule } from '../bitirx/bitrix.module';

@Module({
  imports: [
    BitrixModule,
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const bitrixConfig = configService.get<BitrixConfig>('bitrixConfig');

        if (!bitrixConfig) throw new Error('Invalid bitrix config');
        const { bitrixDomain } = bitrixConfig;

        return {
          baseURL: bitrixDomain,
          headers: {
            'Content-Type': 'application/json',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [...httpProviders, AppHttpService],
  exports: [AppHttpService],
})
export class AppHttpModule {}
