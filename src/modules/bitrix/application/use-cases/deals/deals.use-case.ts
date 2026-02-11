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

      if (total > BITRIX_LIMIT_REQUESTS) {
        let batchCommandsIndex = 0;
        const batchCommandsMap = new Map<number, B24BatchCommands>();

        // Получаем кол-во запросов
        const queries = Math.ceil(total / BITRIX_LIMIT_REQUESTS);
        let page = 1;

        while (page <= queries) {
          let commands = batchCommandsMap.get(batchCommandsIndex) ?? {};

          if (Object.keys(commands).length === BITRIX_LIMIT_REQUESTS) {
            batchCommandsIndex++;
            commands = batchCommandsMap.get(batchCommandsIndex) ?? {};
          }

          const start = (page - 1) * BITRIX_LIMIT_REQUESTS;

          commands[`get_deals=${start}`] = {
            method: 'crm.deal.list',
            params: {
              filter: dealsListFilter,
              select: dealsListSelect,
              start: start,
            },
          };

          batchCommandsMap.set(batchCommandsIndex, commands);

          page += 1;
        }

        if (batchCommandsMap.size > 0) {
          const responses = await Promise.all(
            Array.from(batchCommandsMap.values()).map((commands) =>
              this.bitrixService.callBatch<Record<string, B24Deal[]>>(commands),
            ),
          );

          const errors = this.bitrixService.checkBatchErrors(responses);

          // Валидация ошибок
          if (errors.length > 0) throw new UnprocessableEntityException(errors);

          responses.forEach(({ result: { result } }) => {
            Object.values(result).forEach((responseDeals) =>
              deals.push(...responseDeals),
            );
          });
        }
      } else {
        deals.push(...data);
      }

      if (deals.length === 0)
        throw new UnprocessableEntityException('Сделок не найдено');

      const batchCommands: B24BatchCommands = {};

      let notifyZagoskinaMessage = '';

      deals.forEach(
        ({
          ID: dealId,
          TITLE: dealTitle,
          UF_CRM_1589349464: dealProjectManager,
        }) => {
          const message = `По проекту [b]${this.bitrixService.generateDealUrl(dealId, dealTitle)}[/b] до сих пор не подписан договор. Необходимо связаться с клиентом и запросить подписанный договор.`;

          batchCommands[`notify_manager=${dealProjectManager}=${dealId}`] = {
            method: 'im.message.add',
            params: {
              DIALOG_ID: dealProjectManager,
              MESSAGE: message,
            },
          };

          notifyZagoskinaMessage +=
            message +
            `[br]Ответственный: [user=${dealProjectManager}][/user][br][br]`;
        },
      );

      batchCommands[`notify_${chatId}`] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: chatId,
          MESSAGE: notifyZagoskinaMessage,
        },
      };

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
