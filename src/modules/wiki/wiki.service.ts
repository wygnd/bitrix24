import { Injectable } from '@nestjs/common';
import { WikiApiServiceNew } from '@/modules/wiki/wiki-api-new.service';
import { DepartmentHeadDealCount } from '@/modules/bitrix/modules/department/interfaces/department-api.interface';
import { DistributeAdvertDealWikiResponse } from '@/modules/wiki/interfaces/wiki-distribute-deal.interface';
import { WikiApiServiceOld } from '@/modules/wiki/wiki-api-old.service';
import { GetWorkingSalesInterface } from '@/modules/wiki/interfaces/wiki-get-working-sales.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  WikiUpdateLeadRequest,
  WikIUpdateLeadResponse,
} from '@/modules/wiki/interfaces/wiki-update-lead.interface';
import { WikiDeleteLead } from '@/modules/wiki/interfaces/wiki-delete-lead.interface';
import { WikiNotifyReceivePaymentOptions } from '@/modules/wiki/interfaces/wiki-notify-receive-payment';
import { WinstonLogger } from '@/config/winston.logger';
import qs from 'qs';

@Injectable()
export class WikiService {
  private readonly logger = new WinstonLogger(
    WikiService.name,
    'wiki'.split(':'),
  );

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
      await this.wikiApiServiceOld.get<GetWorkingSalesInterface>(
        '?action=get_working_sales',
      );

    if (!status) return [];

    this.redisService.set<string[]>(
      REDIS_KEYS.WIKI_WORKING_SALES,
      sales,
      300, // 5 minutes
    );

    return sales;
  }

  public async sendResultReceiveClientRequestFromAvitoToWiki(
    fields: WikiUpdateLeadRequest,
  ): Promise<WikIUpdateLeadResponse> {
    try {
      return await this.wikiApiServiceNew.patch<
        Omit<WikiUpdateLeadRequest, 'wiki_lead_id'>,
        WikIUpdateLeadResponse
      >(`/avito/leads/${fields.wiki_lead_id}`, {
        lead_id: fields.lead_id,
        status: fields.status,
      });
    } catch (e) {
      return {
        wiki_lead_id: 0,
        lead_id: 0,
        message: e.response.statusText ?? 'Invalid update lead',
      };
    }
  }

  public async sendNotifyAboutDeleteLead(leadId: string) {
    try {
      return await this.wikiApiServiceNew.delete<WikiDeleteLead>(
        `/avito/leads/${leadId}`,
      );
    } catch (e) {
      return {
        message: e.response.data.message ?? 'Invalid remove lead',
        deleted: 0,
        lead_id: 0,
      };
    }
  }

  public async notifyWikiAboutReceivePayment(
    data: WikiNotifyReceivePaymentOptions,
  ) {
    try {
      const response = await this.wikiApiServiceOld.post(
        '',
        qs.stringify(data),
      );
      this.logger.debug(response, true);
      return true;
    } catch (error) {
      this.logger.error(error, true);
      return false;
    }
  }
}
