import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixDealsPort } from '@/modules/bitrix/application/ports/deals/deals.port';
import {
  B24Deal,
  B24DealListParams,
} from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import {
  B24ActionType,
  B24BatchCommands,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import { BitrixDealsFieldOptions } from '@/modules/bitrix/application/interfaces/deals/fields/deals-field.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { BITRIX_LIMIT_REQUESTS } from '@/modules/bitrix/application/constants/common/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

@Injectable()
export class BitrixDealsUseCase {
  private readonly logger = new WinstonLogger(
    BitrixDealsUseCase.name,
    'bitrix:deals'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.DEALS.DEALS_DEFAULT)
    private readonly deals: BitrixDealsPort,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
  ) {}

  async getDeals(fields?: B24DealListParams, action: B24ActionType = 'cache') {
    return this.deals.getDeals(fields, action);
  }

  async getDealById(dealId: string, action: B24ActionType = 'cache') {
    return this.deals.getDealById(dealId, action);
  }

  async getDealFields() {
    return this.deals.getDealFields();
  }

  async getDealField(fieldId: string) {
    return this.deals.getDealField(fieldId);
  }

  async createDeal(fields: Partial<B24Deal>) {
    return this.deals.createDeal(fields);
  }

  async getDuplicateDealsByPhone(phone: string) {
    return this.deals.getDuplicateDealsByPhone(phone);
  }

  /**
   * Check deals on stage **2. Ожидаем бриф** on existing filled field **Есть подписанный договор**
   *
   * ---
   *
   * Проверяет сделки на стадии **2. Ожидаем бриф** на наличие подписанного контракта
   * @param fields
   */
  public async handleCheckSiteDealsField(fields: BitrixDealsFieldOptions) {
    try {
      const { chat_id: chatId } = fields;
      const dealsListSelect: (keyof B24Deal)[] = [
        'ID',
        'TITLE',
        'UF_CRM_1589349464',
      ];
      const dealsListFilter: Partial<Record<keyof B24Deal, any>> = {
        '!STAGE_ID': ['WON', 'LOSE', '16'], // На всех этапах, кроме Сделка завершена, Сделка провалена, Заморозка
        CATEGORY_ID: '0', // Воронка: Разработка сайтов
        '@UF_CRM_1657086374': ['', '7260'], // Есть подписанный договор
      };
      const deals: B24Deal[] = [];

      const { data, total } = await this.deals.getDeals({
        filter: dealsListFilter,
        select: dealsListSelect,
        start: 0,
      });

      if (total === 0)
        throw new UnprocessableEntityException('Сделок не найдено');

      let batchCommands: B24BatchCommands = {};

      if (total > BITRIX_LIMIT_REQUESTS) {
        // Получаем кол-во запросов
        const queries = Math.ceil(total / BITRIX_LIMIT_REQUESTS);
        let page = 1;

        while (page <= queries) {
          const start = (page - 1) * BITRIX_LIMIT_REQUESTS;

          batchCommands[`get_deals=${start}`] = {
            method: 'crm.deal.list',
            params: {
              filter: dealsListFilter,
              select: dealsListSelect,
              start: start,
            },
          };

          page += 1;
        }

        const responses =
          await this.bitrixService.callBatches<Record<string, B24Deal[]>>(
            batchCommands,
          );

        // Добавляем сделки к общему массиву сделок
        Object.values(responses).forEach((responseDeals) =>
          deals.push(...responseDeals),
        );
      } else {
        deals.push(...data);
      }

      if (deals.length === 0)
        throw new UnprocessableEntityException('Сделок не найдено');

      this.logger.debug({
        handler: this.handleCheckSiteDealsField.name,
        message: 'check getting deals',
        handler_request: fields,
        batch_request: batchCommands,
        deals: deals,
      });

      batchCommands = {};

      let notifyZagoskinaMessage: string[] = [];
      let notifyZagoskinaMessageIndex = 0;
      let dealNotifiedCount = 0;

      deals.forEach(
        ({
          ID: dealId,
          TITLE: dealTitle,
          UF_CRM_1589349464: dealProjectManager,
        }) => {
          // const message = `По проекту [b]${this.bitrixService.generateDealUrl(dealId, dealTitle)}[/b] до сих пор не подписан договор. Необходимо связаться с клиентом и запросить подписанный договор.`;
          const message = dealTitle;

          if (dealProjectManager) {
            batchCommands[`notify_manager=${dealProjectManager}=${dealId}`] = {
              method: 'im.message.add',
              params: {
                DIALOG_ID: dealProjectManager,
                MESSAGE: message,
              },
            };
          }

          if (dealNotifiedCount == 70) {
            notifyZagoskinaMessageIndex++;
            dealNotifiedCount = 1;
          }

          if (!(notifyZagoskinaMessageIndex in notifyZagoskinaMessage))
            notifyZagoskinaMessage[notifyZagoskinaMessageIndex] = '';

          notifyZagoskinaMessage[notifyZagoskinaMessageIndex] +=
            message +
            (dealProjectManager
              ? `[br]Ответственный: [user=${dealProjectManager}][/user][br][br]`
              : '');

          dealNotifiedCount++;
        },
      );

      notifyZagoskinaMessage.forEach(
        (message, index) =>
          (batchCommands[`notify_${chatId}_${index}`] = {
            method: 'im.message.add',
            params: {
              DIALOG_ID: chatId,
              MESSAGE: message,
            },
          }),
      );

      this.bitrixService.callBatches(batchCommands).then((response) =>
        this.logger.debug({
          handler: this.handleCheckSiteDealsField.name,
          request: { fields, batchCommands },
          response: response,
        }),
      );

      return {
        status: true,
        message: `Success send request to notify managers and ${chatId}`,
      };
    } catch (error) {
      this.logger.error({
        handler: this.handleCheckSiteDealsField.name,
        request: fields,
        response: error,
      });
      throw error;
    }
  }
}
