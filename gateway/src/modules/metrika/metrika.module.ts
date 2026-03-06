import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IYandexMetrikaConfig } from '@/common/interfaces/yandex-config.interface';
import { MetrikaApiService } from '@/modules/metrika/metrika-api.service';
import { MetrikaService } from '@/modules/metrika/metrika.service';
import { BitrixModule } from '@/modules/bitrix/bitrix.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const metrikaConfig =
          configService.getOrThrow<IYandexMetrikaConfig>('yandex.metrika');

        return {
          baseURL: metrikaConfig.baseUrl,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `OAuth ${metrikaConfig.token}`,
          },
        };
      },
    }),
    BitrixModule,
  ],
  providers: [MetrikaApiService, MetrikaService],
  exports: [MetrikaService],
})
export class MetrikaModule {}
