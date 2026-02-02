import { forwardRef, Module } from '@nestjs/common';
import { RedisModule } from '@/modules/redis/redis.module';
import { TokensModule } from '@/modules/tokens/tokens.module';
import { TelphinApiService } from '@/modules/telphin/telphin-api.service';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { BitrixModule } from '@/modules/bitrix/bitrix.module';
import { TelphinController } from '@/modules/telphin/telphin.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TelphinConfig } from '@/common/interfaces/telphin-config.interface';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const telphinConfig =
          configService.getOrThrow<TelphinConfig>('telphinConfig');

        return {
          baseURL: telphinConfig.baseUrl,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-encoding': 'gzip',
          },
        };
      },
    }),
    RedisModule,
    TokensModule,
    forwardRef(() => BitrixModule),
  ],
  controllers: [TelphinController],
  providers: [TelphinApiService, TelphinService],
  exports: [TelphinService],
})
export class TelphinModule {}
