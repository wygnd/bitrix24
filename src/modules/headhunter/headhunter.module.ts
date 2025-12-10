import { forwardRef, Module } from '@nestjs/common';
import { headHunterProviders } from '@/modules/headhunter/headhunter.providers';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { HttpModule } from '@nestjs/axios';
import { HeadHunterController } from '@/modules/headhunter/headhunter.controller';
import { RedisModule } from '@/modules/redis/redis.module';
import { BitrixModule } from '@/modules/bitrix/bitrix.module';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';
import { TokensModule } from '@/modules/tokens/tokens.module';

@Module({
  imports: [
    HttpModule,
    RedisModule,
    forwardRef(() => BitrixModule),
    TokensModule,
  ],
  controllers: [HeadHunterController],
  providers: [...headHunterProviders, HeadHunterService, HeadhunterRestService],
  exports: [HeadHunterService, HeadhunterRestService],
})
export class HeadHunterModule {}
