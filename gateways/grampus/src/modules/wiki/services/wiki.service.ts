import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { WikiApiServiceNew } from '@/modules/wiki/services/wiki-api-new.service';
import { DepartmentHeadDealCount } from '@/modules/bitrix/application/interfaces/departments/departments-api.interface';
import { DistributeAdvertDealWikiResponse } from '@/modules/wiki/interfaces/wiki-distribute-deal.interface';
import { WikiApiServiceOld } from '@/modules/wiki/services/wiki-api-old.service';
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
import { NeuroService } from '@/shared/microservices/modules/neuro/services/service';
import { IAnalyzeManagerCallRequest } from '@/shared/microservices/modules/neuro/interfaces/interface';
import { maybeCatchError } from '@/common/utils/catch-error';
import { IWikiReceivedPaymentRequestOptions } from '@/modules/wiki/interfaces/payments/received/request/interface';

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
    private readonly neuroService: NeuroService,
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
        error: maybeCatchError(error),
        body: data,
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
      this.logger.error({
        handler: this.getWorkingSales.name,
        error: maybeCatchError(error),
      });
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
    } catch (error) {
      this.logger.error({
        handler: this.sendResultReceiveClientRequestFromAvitoToWiki.name,
        error: maybeCatchError(error),
      });
      return {
        wiki_lead_id: 0,
        lead_id: 0,
        message: error.response.statusText ?? 'Invalid update lead',
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
    } catch (error) {
      this.logger.error({
        handler: this.sendNotifyAboutDeleteLead.name,
        errors: maybeCatchError(error),
      });
      return {
        message: 'Invalid remove lead',
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
        data,
      });
      return true;
    } catch (error) {
      this.logger.error({
        handler: this.notifyWikiAboutReceivePayment.name,
        error: maybeCatchError(error),
        data,
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
        data: fields,
        response,
      });
      return true;
    } catch (error) {
      this.logger.error({
        handler: this.sendRequestDefinePaymentGroup.name,
        data: fields,
        error: maybeCatchError(error),
      });
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
        error: maybeCatchError(error),
      });
      return [];
    }
  }

  /**
   * Send request on analyze manager calling
   *
   * ---
   *
   * Отправляет запрос на анализ звонка
   */
  public async analyzeManagerCalling(fields: IAnalyzeManagerCallRequest) {
    try {
      // const redisPostIdKey =
      //   REDIS_KEYS.MICROSERVICES_NEURO_ANALYZE_MANAGER_CALL + fields.post_id;
      // const postId = await this.redisService.get<string>(redisPostIdKey);
      //
      // if (postId)
      //   throw new ConflictException({
      //     status: false,
      //     post_id: fields.post_id,
      //     message: 'Звонок анализируется',
      //   });

      // await this.redisService.set<number>(redisPostIdKey, fields.post_id, 300);

      this.neuroService.maybeAnalyzeCall(fields);

      return {
        status: true,
        post_id: fields.post_id,
        message: 'Запрос в обработке',
      };
    } catch (error) {
      console.log('error in service');
      this.logger.debug({
        handler: this.analyzeManagerCalling.name,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Send received payment data to wiki
   *
   * ---
   *
   * Отправляет данные о пришедшем платеже в wiki
   */
  public async sendReceivedPaymentData(
    data: IWikiReceivedPaymentRequestOptions,
  ) {
    try {
      // const response = await this.wikiApiServiceOld.post(
      //   '',
      //   qs.stringify({
      //     action: '',
      //     ...data,
      //   }),
      // );
      // this.logger.debug({
      //   handler: this.sendRequestDefinePaymentGroup.name,
      //   data: data,
      //   response,
      // });
      return true;
    } catch (error) {
      this.logger.error({
        handler: this.sendRequestDefinePaymentGroup.name,
        data: data,
        error: maybeCatchError(error),
      });
      return false;
    }
  }
}
