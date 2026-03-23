import { Module } from '@nestjs/common';
import { wikiProviders } from '@/modules/wiki/providers/wiki.providers';
import { WikiApiServiceNew } from '@/modules/wiki/services/wiki-api-new.service';
import { WikiService } from '@/modules/wiki/services/wiki.service';
import { WikiApiServiceOld } from '@/modules/wiki/services/wiki-api-old.service';
import { RedisModule } from '@/modules/redis/redis.module';
import { WikiController } from '@/modules/wiki/controllers/wiki.controller';
import { SharedModule } from '@/shared/module';

@Module({
  imports: [RedisModule, SharedModule],
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
