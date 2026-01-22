import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { B24Emoji, B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixLeadsPort } from '@/modules/bitrix/application/ports/leads/leads.port';
import {
  BitrixGrampusSiteRequestReceive,
  BitrixGrampusSiteRequestReceiveExtraParamsOptions,
  BitrixGrampusSiteRequestReceiveExtraParamsVacancyOptions,
  BitrixGrampusSiteRequestReceiveResponse,
} from '@/modules/bitrix/application/interfaces/grampus/bitrix-site-request.interface';
import {
  B24LeadActiveStages,
  B24LeadConvertedStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/application/constants/leads/lead.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import type { BitrixUsersPort } from '@/modules/bitrix/application/ports/users/users.port';
import { WikiService } from '@/modules/wiki/wiki.service';
import type { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import { WinstonLogger } from '@/config/winston.logger';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24Lead } from '@/modules/bitrix/application/interfaces/leads/lead.interface';
import type { BitrixDealsPort } from '@/modules/bitrix/application/ports/deals/deals.port';
import { B24Deal } from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import type { BitrixMessagesPort } from '@/modules/bitrix/application/ports/messages/messages.port';

const { LEADS, BITRIX, USERS, BOT, DEALS, MESSAGES } = B24PORTS;

@Injectable()
export class BitrixGrampusUseCase {
  private readonly logger = new WinstonLogger(
    BitrixGrampusUseCase.name,
    'bitrix:grampus'.split(':'),
  );

  /**
   * List of sale manager whose will be distributed when client send request from grampus site
   *
   * ---
   *
   * Список менеджеров по продажам, на которых будут распределятся заявки, оставленные клиентами с сайтов grampus
   *
   * 495 - Дмитрий Зиминов
   * 714 - Дмитрий Васильев
   * 114 - Дмитрий Андреев
   *
   * @private
   * @readonly
   */
  private readonly availableSalesForDistribute = ['496', '714', '114'];

  constructor(
    @Inject(LEADS.LEADS_DEFAULT)
    private readonly bitrixLeads: BitrixLeadsPort,
    @Inject(BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(USERS.USERS_DEFAULT)
    private readonly bitrixUsers: BitrixUsersPort,
    @Inject(BOT.BOT_DEFAULT)
    private readonly bitrixBot: BitrixBotPort,
    private readonly wikiService: WikiService,
    @Inject(DEALS.DEALS_DEFAULT)
    private readonly bitrixDeals: BitrixDealsPort,
    @Inject(MESSAGES.MESSAGES_DEFAULT)
    private readonly bitrixMessages: BitrixMessagesPort,
  ) {}

  /**
   * Handle client requests from form on grampus site's
   *
   * ---
   *
   * Обработка клиентских заявок с форм на сайтах grampus
   * @param fields
   */
  async handleRequestFromSite(
    fields: BitrixGrampusSiteRequestReceive,
  ): Promise<BitrixGrampusSiteRequestReceiveResponse> {
    this.logger.debug(fields);
    try {
      const { url } = fields;

      switch (true) {
        // Если заявка со страницы вакансии
        case /vacancy/gi.test(url):
          return this.handleRequestFromSiteToHandleHRDeal(fields);

        default:
          return this.handleRequestFromSiteToHandleLead(fields);
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Default handle request from grampus site
   *
   * ---
   *
   * Стандартный обработчик зявки с grampus-studio
   * @param fields
   * @private
   */
  private async handleRequestFromSiteToHandleLead(
    fields: BitrixGrampusSiteRequestReceive,
  ): Promise<BitrixGrampusSiteRequestReceiveResponse> {
    const {
      phone,
      url,
      clientName = '',
      comment = '',
      extraParams = '',
    } = fields;
    const params = extraParams
      ? (JSON.parse(
          extraParams,
        ) as BitrixGrampusSiteRequestReceiveExtraParamsOptions)
      : null;

    // Ищем дубликаты по номеру клиента
    const duplicateLeads =
      await this.bitrixLeads.getDuplicateLeadsByPhone(phone);
    const trafficsChatId =
      this.bitrixService.getConstant('GRAMPUS').trafficsChatId;
    const managerId = await this.getAssignedManagerId();

    // Если не нашли дубликатов: создаем лид
    if (duplicateLeads.length === 0) {
      const createLeadFields: Partial<B24Lead> = {
        NAME: clientName, // Имя
        UF_CRM_1651577716: '11816', // Тип лида: Заявка с сайта
        UF_CRM_1573459036: '70', // Откуда: С сайта
        UF_CRM_1598441630: '4834', // С чем обратился: Разработка сайта
        STATUS_ID: B24LeadActiveStages[0], // Новый в работе
        COMMENTS: `Добавлен со страницы: ${url}\n`,
        ASSIGNED_BY_ID: managerId,
        PHONE: [
          {
            VALUE_TYPE: 'WORK',
            VALUE: phone,
          },
        ],
      };

      switch (params && params?.type) {
        case 'discount':
          createLeadFields.COMMENTS +=
            (params?.fields?.discount?.percent
              ? `Процент скидки: ${params?.fields?.discount.percent}\nСо страницы ${url}\n`
              : '') +
            (params?.fields?.discount?.bonus
              ? `\nБонус: ${params?.fields?.discount.bonus}`
              : '') +
            comment;
          break;

        default:
          createLeadFields.COMMENTS += comment;
          break;
      }

      if (/razrabotka-sajtov-na-bitriks/i.test(url)) {
        // Если со страницы "Разработка сайтов на битрикс"

        createLeadFields.UF_CRM_1573459036 = '876'; // Откуда: Контекст трафика
        createLeadFields.UF_CRM_1598441630 = '11762'; // С чем обратился: Разработка сайта на 1С Битрикс
      }

      const leadId = await this.bitrixLeads.createLead(createLeadFields);

      let message: string;

      if (leadId == 0) {
        // Если по какой-то причине не удалось добавить лид
        message = `${B24Emoji.REFUSAL} Не удалось добавить `;
      } else {
        // Если лид успешно создан
        message = `Добавлен `;
      }

      message +=
        `лид со страницы ${url}[br][br]` +
        this.bitrixService.generateLeadUrl(leadId);

      // Отправляем сообщение в чат и в личные сообщения ответственному менеджеру
      this.bitrixService.callBatch({
        notify_chat: {
          method: 'imbot.message.add',
          params: {
            DIALOG_ID: trafficsChatId,
            MESSAGE: message,
            URL_PREVIEW: 'N',
          },
        },
        notify_manager: {
          method: 'im.message.add',
          params: {
            DIALOG_ID: managerId,
            MESSAGE: message,
            URL_PREVIEW: 'N',
          },
        },
      });

      return {
        message: 'Successfully create lead',
        status: true,
      };
    }

    const lead = await this.bitrixLeads.getLeadById(`${duplicateLeads[0]}`);

    if (!lead) {
      this.bitrixBot.sendMessage({
        DIALOG_ID: trafficsChatId,
        MESSAGE: `Заявка с сайта. Ранее лид уже был добавлен. Cо страницы ${url}[br][br][b]Не удалось обновить лид[/b]`,
      });
      return {
        message: 'Failed to update lead',
        status: false,
      };
    }

    const BOT_ID = this.bitrixService.getConstant('BOT_ID');
    const {
      STATUS_ID: leadStatusId,
      ID: leadId,
      ASSIGNED_BY_ID: leadAssignedId,
      COMMENTS: leadComments = '',
    } = lead;

    const batchCommands: B24BatchCommands = {};
    let updatedMessage: string;

    switch (true) {
      case B24LeadRejectStages.includes(leadStatusId):
        // Если лид в неактивной стадии: меняем ответственного и уведомляем об этом
        const updateLeadFields: Partial<B24Lead> = {
          ASSIGNED_BY_ID: managerId,
          STATUS_ID: B24LeadActiveStages[0], // Новый в работе
          NAME: clientName,
          COMMENTS: leadComments,
        };

        switch (params && params?.type) {
          case 'discount':
            updateLeadFields.COMMENTS +=
              (params?.fields?.discount?.percent
                ? `Процент скидки: ${params?.fields?.discount.percent}\nСо страницы ${url}\n`
                : '') +
              (params?.fields?.discount?.bonus
                ? `\nБонус: ${params?.fields?.discount.bonus}`
                : '') +
              comment;
            break;

          default:
            updateLeadFields.COMMENTS += comment;
            break;
        }

        updatedMessage =
          `Заявка с сайта. Ранее лид уже был добавлен. Cо страницы ${url}[br][br]` +
          this.bitrixService.generateLeadUrl(leadId);

        if (/razrabotka-sajtov-na-bitriks/i.test(url)) {
          // Если со страницы "Разработка сайта на битркис"

          updateLeadFields.UF_CRM_1573459036 = '876'; // Откуда: Контекст трафика
          updateLeadFields.UF_CRM_1598441630 = '11762'; // С чем обратился: Разработка сайта на 1С Битрикс
        }

        batchCommands['update_lead'] = {
          method: 'crm.lead.update',
          params: {
            id: leadId,
            fields: updateLeadFields,
          },
        };

        batchCommands['notify_chat'] = {
          method: 'imbot.message.add',
          params: {
            BOT_ID: BOT_ID,
            DIALOG_ID: trafficsChatId,
            MESSAGE: updatedMessage,
            URL_PREVIEW: 'N',
          },
        };

        batchCommands['notify_manager'] = {
          method: 'im.message.add',
          params: {
            DIALOG_ID: managerId,
            MESSAGE: updatedMessage,
            URL_PREVIEW: 'N',
          },
        };
        break;

      case B24LeadNewStages.includes(leadStatusId):
      case B24LeadActiveStages.includes(leadStatusId):
      case B24LeadConvertedStages.includes(leadStatusId):
        // Если лид в новых или активных или завершающих стадиях
        // добавляем комментарий и отправляем сообщение в чат
        updatedMessage =
          `Клиент повторно обратился на сайт ${url}[br][br]` +
          this.bitrixService.generateLeadUrl(leadId);

        if (B24LeadConvertedStages.includes(leadStatusId)) {
          // Если лид в завершающих стадиях

          updatedMessage =
            `${B24Emoji.SUCCESS} Действующий клиент обратился на сайт ${url}[br][br]` +
            this.bitrixService.generateLeadUrl(leadId);
        }
        batchCommands['add_comment'] = {
          method: 'crm.timeline.comment.add',
          params: {
            fields: {
              ENTITY_ID: leadId,
              ENTITY_TYPE: 'lead',
              AUTHOR_ID: leadAssignedId,
              COMMENT: `Клиент обратился на сайт ${url}`,
            },
          },
        };

        batchCommands['notify_chat'] = {
          method: 'imbot.message.add',
          params: {
            BOT_ID: BOT_ID,
            DIALOG_ID: trafficsChatId,
            MESSAGE: updatedMessage,
            URL_PREVIEW: 'N',
          },
        };

        if (!B24LeadConvertedStages.includes(leadStatusId))
          batchCommands['notify_manager'] = {
            method: 'im.message.add',
            params: {
              DIALOG_ID: leadAssignedId,
              MESSAGE: updatedMessage,
              URL_PREVIEW: 'N',
            },
          };
        break;
    }

    this.bitrixService.callBatch(batchCommands);

    return {
      message: 'Successfully update lead',
      status: true,
    };
  }

  /**
   * Handle request from vacancy page in grampus-studio
   *
   * ---
   *
   * Обработка завяки со страницы вакансии grampus-studio
   * @param fields
   * @private
   */
  private async handleRequestFromSiteToHandleHRDeal(
    fields: BitrixGrampusSiteRequestReceive,
  ): Promise<BitrixGrampusSiteRequestReceiveResponse> {
    const { phone, extraParams = '' } = fields;

    const deals = await this.bitrixDeals.getDuplicateDealsByPhone(phone);
    let params: BitrixGrampusSiteRequestReceiveExtraParamsVacancyOptions | null =
      null;

    try {
      params = JSON.parse(
        extraParams,
      ) as BitrixGrampusSiteRequestReceiveExtraParamsVacancyOptions;
    } catch (error) {
      params = null;
      console.log(error);
      this.logger.error(error);
    }

    const createOrUpdateDealFields: Partial<B24Deal> = {
      UF_CRM_1638524259: phone, // Номер телефона
      CATEGORY_ID: '14', // HR воронка
      UF_CRM_1644922120: '8874', // Тип поиска: Заявка с сайта
      UF_CRM_1638524000: '', // Вакансия
      STAGE_ID: 'C14:NEW', // Стадия: Звонок
      ASSIGNED_BY_ID: '190', // Екатерина Туркатова
    };

    const batchCommands: B24BatchCommands = {};
    let message = '[b]Заявка с сайта![/b] ';

    // Если не нашли дубликатов создаем сделку, иначе обновляем
    if (deals.length === 0) {
      batchCommands['create_deal'] = {
        method: 'crm.deal.add',
        params: {
          fields: createOrUpdateDealFields,
        },
      };
      message += 'Добавлена новая сделка';
    } else {
      batchCommands['update_deal'] = {
        method: 'crm.deal.update',
        params: {
          id: deals[0].ID,
          fields: createOrUpdateDealFields,
        },
      };

      message += 'Сделка обновлена';
    }

    this.bitrixService.callBatch(batchCommands).then((res) => {
      this.logger.debug({
        request: batchCommands,
        response: res,
      });

      this.bitrixMessages.sendPrivateMessage({
        DIALOG_ID: '190', // Екатерина Туркатова
        MESSAGE:
          message +
          '[br]' +
          (params && params?.fields && params.fields?.vacancy
            ? `[b]Вакансия: ${params.fields.vacancy}[/b][br]`
            : '') +
          '[br]' +
          this.bitrixService.generateDealUrl(
            deals.length > 0 ? deals[0].ID : res.result.result.create_deal,
          ),
      });
    });

    return {
      status: true,
      message: 'Successfully handle request',
    };
  }

  /**
   * Get assigned manager id by workflow
   *
   * ---
   *
   * Получить id менеджера по кол-ву лидов
   * @private
   */
  private async getAssignedManagerId(): Promise<string> {
    const ZLATA_ZIMINA_BITRIX_ID = this.bitrixService.getConstant(
      'ZLATA_ZIMINA_BITRIX_ID',
    );

    // Если не рабочее время возвращаем bitrix_id Златы Зиминой
    if (!this.bitrixService.isAvailableToDistributeOnManager())
      return ZLATA_ZIMINA_BITRIX_ID;

    // Получаем список менеджеров, которые работают из вики
    const currentWorkingSaleList = await this.wikiService.getWorkingSales();

    // Фильтруем менеджеров, которых получили и доступных для распределения
    const users = this.availableSalesForDistribute.reduce<string[]>(
      (acc, sale) => {
        if (!currentWorkingSaleList.find((s) => s == sale)) return acc;
        acc.push(sale);
        return acc;
      },
      [],
    );

    // Получаем менеджера, у которого меньше всего лидов
    const assignedId = await this.bitrixUsers.getMinWorkflowUser(users);

    // Если по какой-то причине не получили id менеджера возвращаем id Златы Зиминой
    return assignedId ?? ZLATA_ZIMINA_BITRIX_ID;
  }
}
