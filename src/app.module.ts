import { Module } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BitrixConfig } from './common/interfaces/bitrix-config.interface';

@Module({
  imports: [
    ConfigAppModule,
    RedisModule,
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
  controllers: [],
  providers: [],
})
export class AppModule {}
