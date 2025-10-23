import { Module } from '@nestjs/common';
import { headHunterProviders } from '@/modules/headhunter/headhunter.providers';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { HttpModule } from '@nestjs/axios';
import { HeadHunterController } from '@/modules/headhunter/headhunter.controller';
import { RedisModule } from '@/modules/redis/redis.module';

@Module({
  imports: [HttpModule, RedisModule],
  controllers: [HeadHunterController],
  providers: [...headHunterProviders, HeadHunterService],
  exports: [HeadHunterService],
})
export class HeadHunterModule {}
