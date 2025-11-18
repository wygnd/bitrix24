import { Injectable } from '@nestjs/common';
import { WikiApiService } from '@/modules/wiki/wiki-api.service';
import { DepartmentHeadDealCount } from '@/modules/bitirx/modules/department/interfaces/department-api.interface';
import { DistributeAdvertDealWikiResponse } from '@/modules/wiki/interfaces/wiki-distribute-deal.interface';

@Injectable()
export class WikiService {
  constructor(private readonly wikiApiService: WikiApiService) {}

  public async getAdvertNextHead(data: DepartmentHeadDealCount) {
    return this.wikiApiService.post<
      DepartmentHeadDealCount,
      DistributeAdvertDealWikiResponse
    >('/advertising-department/destribute-deal/', data, {
      headers: {
        wiki_api_key: 'deniska-pipiska',
      },
    });
  }

  public async sendRejectDistributeNewDeal(
    data: DistributeAdvertDealWikiResponse,
  ) {
    return this.wikiApiService.post<DistributeAdvertDealWikiResponse>(
      '/advertising-department/rollback-counter',
      data,
      {
        headers: {
          wiki_api_key: 'deniska-pipiska',
        },
      },
    );
  }
}
