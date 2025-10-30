import { forwardRef, Module } from '@nestjs/common';
import { headHunterProviders } from '@/modules/headhunter/headhunter.providers';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { HttpModule } from '@nestjs/axios';
import { HeadHunterController } from '@/modules/headhunter/headhunter.controller';
import { RedisModule } from '@/modules/redis/redis.module';
import { BitrixModule } from '@/modules/bitirx/bitrix.module';

@Module({
  imports: [HttpModule, RedisModule, forwardRef(() => BitrixModule)],
  controllers: [HeadHunterController],
  providers: [...headHunterProviders, HeadHunterService],
  exports: [HeadHunterService],
})
export class HeadHunterModule {}
