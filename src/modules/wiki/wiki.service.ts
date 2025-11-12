import { Injectable } from '@nestjs/common';
import { WikiApiService } from '@/modules/wiki/wiki-api.service';
import { DepartmentHeadDealCount } from '@/modules/bitirx/modules/department/interfaces/department-api.interface';
import { DistributeAdvertDealWikiResponse } from '@/modules/wiki/interfaces/wiki-distribute-deal.interface';

@Injectable()
export class WikiService {
  constructor(private readonly wikiApiService: WikiApiService) {}

  // todo: Исправить, когда придет Кирилл0
  public async getAdvertNextHeadOld(data: DepartmentHeadDealCount) {
    return this.wikiApiService.post<
      DepartmentHeadDealCount,
      DistributeAdvertDealWikiResponse
    >('/advertising-department/destribute-deal/', data);
  }

  public async getAdvertNextHead(data: DepartmentHeadDealCount) {
    return this.wikiApiService.post<
      { settings: DepartmentHeadDealCount },
      DistributeAdvertDealWikiResponse
    >(
      '',
      { settings: data },
      {
        baseURL: 'https://bitrix24.grampus-server.ru/src/api/wiki/index.php',
      },
    );
  }

  // todo: Исправить, когда придет Кирилл
  public async sendRejectDistributeNewDealOld(
    data: DistributeAdvertDealWikiResponse,
  ) {
    return this.wikiApiService.post<DistributeAdvertDealWikiResponse>(
      '/advertising-department/rollback-counter',
      data,
    );
  }

  public async sendRejectDistributeNewDeal(
    data: DistributeAdvertDealWikiResponse,
  ) {
    return this.wikiApiService.post<{
      reject_data: DistributeAdvertDealWikiResponse;
    }>(
      '',
      { reject_data: data },
      {
        baseURL: 'https://bitrix24.grampus-server.ru/src/api/wiki/reject.php',
      },
    );
  }
}
