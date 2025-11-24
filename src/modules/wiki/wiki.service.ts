import { BadRequestException, Injectable } from '@nestjs/common';
import { WikiApiServiceNew } from '@/modules/wiki/wiki-api-new.service';
import { DepartmentHeadDealCount } from '@/modules/bitirx/modules/department/interfaces/department-api.interface';
import { DistributeAdvertDealWikiResponse } from '@/modules/wiki/interfaces/wiki-distribute-deal.interface';
import { WikiApiServiceOld } from '@/modules/wiki/wiki-api-old.service';
import { GetWorkingSalesInterface } from '@/modules/wiki/interfaces/wiki-get-working-sales.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { WikiLeadResultRequestClientFromAvito } from '@/modules/wiki/interfaces/wiki-lead-result.interface';

@Injectable()
export class WikiService {
  constructor(
    private readonly wikiApiServiceNew: WikiApiServiceNew, // new-wiki
    private readonly wikiApiServiceOld: WikiApiServiceOld, // wiki.grampus-server
    private readonly redisService: RedisService,
  ) {}

  public async getAdvertNextHead(data: DepartmentHeadDealCount) {
    return this.wikiApiServiceNew.post<
      DepartmentHeadDealCount,
      DistributeAdvertDealWikiResponse
    >('/advertising-department/destribute-deal/', data);
  }

  public async sendRejectDistributeNewDeal(
    data: DistributeAdvertDealWikiResponse,
  ) {
    return this.wikiApiServiceNew.post<DistributeAdvertDealWikiResponse>(
      '/advertising-department/rollback-counter',
      data,
    );
  }

  public async getWorkingSalesFromWiki(force: boolean = false) {
    if (!force) {
      const salesFromCache = await this.redisService.get<string[]>(
        REDIS_KEYS.WIKI_WORKING_SALES,
      );

      if (salesFromCache) return salesFromCache;
    }

    const { sales, status } =
      await this.wikiApiServiceOld.get<GetWorkingSalesInterface>('', {
        baseURL:
          'https://bitrix24.grampus-server.ru/src/api/wiki/working-sales.php',
      });

    if (!status)
      throw new BadRequestException('Invalid get working sales from wiki');

    this.redisService.set<string[]>(
      REDIS_KEYS.WIKI_WORKING_SALES,
      sales,
      3600, // 1 hour
    );

    return sales;
  }

  // todo: Write function
  public async sendResultReceiveClientRequestFromAvitoToWiki(
    fields: WikiLeadResultRequestClientFromAvito,
  ) {}
}
