import { Module } from '@nestjs/common';
import { wikiProviders } from '@/modules/wiki/wiki.providers';
import { WikiApiServiceNew } from '@/modules/wiki/wiki-api-new.service';
import { WikiService } from '@/modules/wiki/wiki.service';
import { WikiApiServiceOld } from '@/modules/wiki/wiki-api-old.service';
import { RedisModule } from '@/modules/redis/redis.module';
import { WikiController } from '@/modules/wiki/wiki.controller';

@Module({
  imports: [RedisModule],
  controllers: [WikiController],
  providers: [
    ...wikiProviders,
    WikiApiServiceNew,
    WikiApiServiceOld,
    WikiService,
  ],
  exports: [WikiService],
})
export class WikiModule {}
