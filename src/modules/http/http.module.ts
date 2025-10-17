import {
  HttpException,
  HttpStatus,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BitrixConfig } from '../../common/interfaces/bitrix-config.interface';
import { AppHttpService } from './http.service';
import { B24Response } from '../bitirx/interfaces/bitrix-api.interface';
import { AxiosResponse } from 'axios';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
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
  providers: [AppHttpService],
  exports: [AppHttpService],
})
export class AppHttpModule {}
