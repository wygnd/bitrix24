import { forwardRef, Module } from '@nestjs/common';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { HttpModule } from '@nestjs/axios';
import { HeadHunterController } from '@/modules/headhunter/headhunter.controller';
import { RedisModule } from '@/modules/redis/redis.module';
import { BitrixModule } from '@/modules/bitrix/bitrix.module';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';
import { TokensModule } from '@/modules/tokens/tokens.module';
import { ConfigService } from '@nestjs/config';
import { HeadHunterConfig } from '@/common/interfaces/headhunter-config.interface';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const headHunterConfig =
          configService.getOrThrow<HeadHunterConfig>('headHunterConfig');

        return {
          baseURL: headHunterConfig.baseUrl,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        };
      },
    }),
    RedisModule,
    forwardRef(() => BitrixModule),
    TokensModule,
  ],
  controllers: [HeadHunterController],
  providers: [HeadHunterService, HeadhunterRestService],
  exports: [HeadHunterService, HeadhunterRestService],
})
export class HeadHunterModule {}
