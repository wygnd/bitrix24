import { Module } from '@nestjs/common';
import { wikiProviders } from '@/modules/wiki/wiki.providers';
import { WikiApiServiceNew } from '@/modules/wiki/wiki-api-new.service';
import { WikiService } from '@/modules/wiki/wiki.service';
import { WikiApiServiceOld } from '@/modules/wiki/wiki-api-old.service';
import { RedisModule } from '@/modules/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [
    ...wikiProviders,
    WikiApiServiceNew,
    WikiApiServiceOld,
    WikiService,
  ],
  exports: [WikiService],
})
export class WikiModule {}
