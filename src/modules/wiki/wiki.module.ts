import { Module } from '@nestjs/common';
import { wikiProviders } from '@/modules/wiki/wiki.providers';
import { WikiApiService } from '@/modules/wiki/wiki-api.service';
import { WikiService } from '@/modules/wiki/wiki.service';

@Module({
  imports: [],
  providers: [...wikiProviders, WikiApiService, WikiService],
  exports: [WikiService],
})
export class WikiModule {}
