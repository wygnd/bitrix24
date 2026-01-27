import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { WikiApiServiceNew } from '@/modules/wiki/wiki-api-new.service';
import { DepartmentHeadDealCount } from '@/modules/bitrix/application/interfaces/departments/departments-api.interface';
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
import { WikiSendDefinPaymentGroupInterface } from '@/modules/wiki/interfaces/wiki-send-defin-payment-group.interface';
import { WikiCheckMissDays } from '@/modules/wiki/interfaces/wiki-check-miss-days.interface';

@Injectable()
export class WikiService {
  private readonly logger = new WinstonLogger(
    WikiService.name,
    'wiki'.split(':'),
  );

  constructor(
    private readonly wikiApiServiceNew: WikiApiServiceNew, // new-wiki
    private readonly wikiApiServiceOld: WikiApiServiceOld, // wiki.grampus-studio
    private readonly redisService: RedisService,
  ) {}

  public async getAdvertNextHead(data: DepartmentHeadDealCount) {
    return this.wikiApiServiceNew.post<
      DepartmentHeadDealCount,
      DistributeAdvertDealWikiResponse
    >('/advertising-department/destribute-deal/', data);
  }

  /**
   * Send to avito service information about canceled lead by AI
   *
   * ---
   *
   * Отправляет в сервис авито информацию об отклоненном лиде от ИИ
   * @param data
   */
  public async sendRejectDistributeNewDeal(
    data: DistributeAdvertDealWikiResponse,
  ) {
    try {
      const response =
        await this.wikiApiServiceNew.post<DistributeAdvertDealWikiResponse>(
          '/advertising-department/rollback-counter',
          data,
        );
      this.logger.debug({
        handler: this.sendRejectDistributeNewDeal.name,
        fields: data,
        response,
      });
      return response;
    } catch (error) {
      this.logger.error({
        handler: this.sendRejectDistributeNewDeal.name,
        error,
      });
      throw error;
    }
  }

  /**
   * Get working sales from wiki
   *
   * ---
   *
   * Получить список менеджеров по продажам, кто начал рабочий день и не на перерыве
   * @param force
   */
  public async getWorkingSales(force: boolean = false) {
    try {
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
    } catch (error) {
      this.logger.error({ handler: this.getWorkingSales.name, error });
      throw error;
    }
  }

  /**
   * Send request about new bitrix lead to wiki
   *
   * ---
   *
   * Отправляет запрос о новой лиде в wiki
   * @param fields
   */
  public async sendResultReceiveClientRequestFromAvitoToWiki(
    fields: WikiUpdateLeadRequest,
  ): Promise<WikIUpdateLeadResponse> {
    try {
      const response = await this.wikiApiServiceNew.patch<
        Omit<WikiUpdateLeadRequest, 'wiki_lead_id'>,
        WikIUpdateLeadResponse
      >(`/avito/leads/${fields.wiki_lead_id}`, {
        lead_id: fields.lead_id,
        status: fields.status,
      });
      this.logger.debug({
        handler: this.sendResultReceiveClientRequestFromAvitoToWiki.name,
        fields,
        response,
      });
      return response;
    } catch (e) {
      this.logger.error({
        handler: this.sendResultReceiveClientRequestFromAvitoToWiki.name,
        error: e,
      });
      return {
        wiki_lead_id: 0,
        lead_id: 0,
        message: e.response.statusText ?? 'Invalid update lead',
      };
    }
  }

  /**
   * Send request to new wiki about delete lead in bitrix
   *
   * ---
   *
   * Отправляем запрос в new wiki о том, что лид был удален
   * @param leadId
   */
  public async sendNotifyAboutDeleteLead(leadId: string) {
    try {
      const response = await this.wikiApiServiceNew.delete<WikiDeleteLead>(
        `/avito/leads/${leadId}`,
      );
      this.logger.debug({
        handler: this.sendNotifyAboutDeleteLead.name,
        response,
      });
      return response;
    } catch (e) {
      this.logger.error({
        handler: this.sendNotifyAboutDeleteLead.name,
        errors: e,
      });
      return {
        message: e.response.data.message ?? 'Invalid remove lead',
        deleted: 0,
        lead_id: 0,
      };
    }
  }

  /**
   * Send request to old wiki about receive payment
   *
   * ---
   *
   * Отправляем запрос в wiki о том, что получили платеж
   * @param data
   */
  public async notifyWikiAboutReceivePayment(
    data: WikiNotifyReceivePaymentOptions,
  ) {
    try {
      const response = await this.wikiApiServiceOld.post(
        '',
        qs.stringify(data),
      );

      this.logger.debug({
        handler: this.notifyWikiAboutReceivePayment.name,
        response,
      });
      return true;
    } catch (error) {
      this.logger.error({
        handler: this.notifyWikiAboutReceivePayment.name,
        error,
      });
      return false;
    }
  }

  /**
   * Send request to old wiki to define payment group
   *
   * ---
   *
   * Отправляем запрос в wiki, для установления группы платежа
   * @param fields
   */
  public async sendRequestDefinePaymentGroup(
    fields: WikiSendDefinPaymentGroupInterface,
  ) {
    try {
      const response = await this.wikiApiServiceOld.post(
        '',
        qs.stringify({
          action: 'gft_setup_payment_group',
          ...fields,
        }),
      );
      this.logger.debug({
        handler: this.sendRequestDefinePaymentGroup.name,
        response,
      });
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Get sale manager ids which don't start work day at last three days
   *
   * ---
   *
   * Получает массив id менеджеров по продажам, которые не начинали рабочий день 3 дня подряд
   */
  public async getMissDaysWorkers(): Promise<string[]> {
    try {
      const response = await this.wikiApiServiceOld.post<
        string,
        WikiCheckMissDays
      >(
        '',
        qs.stringify({
          action: 'gtc_check_miss_days_workers',
        }),
      );

      this.logger.debug({ handler: this.getMissDaysWorkers.name, response });

      if (!response.status)
        throw new UnprocessableEntityException(
          'Ошибка получения данных с wiki',
        );

      return response.bitrix_ids;
    } catch (error) {
      this.logger.error({
        handler: this.getMissDaysWorkers.name,
        error,
      });
      return [];
    }
  }
}
