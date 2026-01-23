import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { B24Categories, B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixLeadsUpsellRepositoryPort } from '@/modules/bitrix/application/ports/leads/leads-upsell-repository.port';
import {
  B24HandleUpsellOptions,
  B24LeadUpsellAddInQueueOptions,
  B24LeadUpsellAttributes,
  B24LeadUpsellCreationalAttributes,
  B24LeadUpsellQuestionsFields,
  B24LeadUpsellStatuses,
} from '@/modules/bitrix/application/interfaces/leads/lead-upsell.interface';
import { FindOptions } from 'sequelize';
import { QueueLightAddTaskHandleUpsellDeal } from '@/modules/queue/interfaces/queue-light.interface';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import {
  B24BatchCommands,
  B24DealCategories,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { B24LeadConvertedStages } from '@/modules/bitrix/application/constants/leads/lead.constants';
import { WikiService } from '@/modules/wiki/wiki.service';
import {
  B24Deal,
  B24DealFields,
} from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import { B24User } from '@/modules/bitrix/application/interfaces/users/user.interface';
import { B24Department } from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import type { BitrixDealsPort } from '@/modules/bitrix/application/ports/deals/deals.port';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

@Injectable()
export class BitrixLeadsUpsellUseCase {
  private readonly logger = new WinstonLogger(
    BitrixLeadsUpsellUseCase.name,
    'bitrix:leads'.split(':'),
  );
  private readonly upsellQuestionFields: B24LeadUpsellQuestionsFields = {
    SITE: {
      fields: [
        'UF_CRM_1759735153',
        'UF_CRM_1759735721',
        'UF_CRM_1759735732',
        'UF_CRM_1759735742',
        'UF_CRM_1759735750',
      ],
      messages: {
        working:
          'Завершена разработка сайта. Необходимо допродать Клиенту РК и SEO[br]',
        notWorking:
          'Менеджер отсутствует. Необходимо распределить сделку на допродажу РК/SEO[br]',
        fired:
          'Менеджер уволен. Необходимо распределить сделку на допродажу РК/SEO[br]',
      },
    },
    ADVERT: {
      fields: [
        'UF_CRM_1759990409',
        'UF_CRM_1759990421',
        'UF_CRM_1759990430',
        'UF_CRM_1759990441',
      ],
      messages: {
        working: '',
        notWorking: '',
        fired: '',
      },
    },
    SEO: {
      fields: [
        'UF_CRM_1760605596',
        'UF_CRM_1759990421',
        'UF_CRM_1760605616',
        'UF_CRM_1591201913',
        'UF_CRM_1759990441',
      ],
      messages: {
        working: '',
        notWorking: '',
        fired: '',
      },
    },
    UNKNOWN: {
      fields: [],
      messages: {
        working: '',
        notWorking: '',
        fired: '',
      },
    },
  };

  constructor(
    @Inject(B24PORTS.LEADS.UPSELLS_REPOSITORY)
    private readonly leadsUpsell: BitrixLeadsUpsellRepositoryPort,
    private readonly queueLightService: QueueLightService,
    @Inject(B24PORTS.DEALS.DEALS_DEFAULT)
    private readonly bitrixDeals: BitrixDealsPort,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    private readonly wikiService: WikiService,
  ) {}

  addUpsell(fields: B24LeadUpsellCreationalAttributes) {
    return this.leadsUpsell.addUpsell(fields);
  }

  getUpsells(options: FindOptions<B24LeadUpsellAttributes> = {}) {
    return this.leadsUpsell.getUpsells(options);
  }

  updateUpsell(upsellId: number, fields: Partial<B24LeadUpsellAttributes>) {
    return this.leadsUpsell.updateUpsell(upsellId, fields);
  }

  /**
   * Add deals and lead info in database
   *
   * ---
   *
   * Добавляет информацию и сделке и лиде в БД
   * @param dealId
   * @param notified
   */
  public async addDealInUpsellQueue({
    dealId,
    notified,
  }: B24LeadUpsellAddInQueueOptions) {
    try {
      const deals = await this.bitrixDeals.getDeals({
        filter: {
          ID: dealId,
        },
        select: [
          'ID',
          'UF_CRM_1731418991',
          'CATEGORY_ID',
          'UF_CRM_1732263292',
          'STAGE_ID',
        ],
        start: 0,
      });

      if (deals.length === 0 || !deals[0].UF_CRM_1731418991)
        return {
          message: 'Invalid add deals in upsell',
          status: false,
        };

      const [deal] = deals;

      let category: B24DealCategories = B24DealCategories.UNKNOWN;

      switch (deal.CATEGORY_ID) {
        case B24Categories.SITES:
          if (deal?.UF_CRM_1732263292 == '11738')
            return { status: false, message: `Site is landing ${dealId}` };

          category = B24DealCategories.SITE;
          break;

        case B24Categories.ADVERT:
        case B24Categories.SETTING_ADVERT:
          category = B24DealCategories.ADVERT;
          break;

        case B24Categories.SEO_OUT:
        case B24Categories.SEO_BASE:
        case B24Categories.SEO_INNER:
          category = B24DealCategories.SEO;
          break;

        default:
          return { status: false, message: `Unknown category ${dealId}` };
      }

      const upsellDto = await this.addUpsell({
        leadId: deal.UF_CRM_1731418991, // Поле: Лид айди
        dealId: dealId,
        category: category,
        status: B24LeadUpsellStatuses.PENDING,
        dateNotify: new Date(
          new Date().getTime() + 60 * 60 * 24 * notified * 1000,
        ),
        dealStage: deal.STAGE_ID,
      });

      if (!upsellDto)
        throw new BadRequestException(
          `Invalid add upsell write upsell in queue: ${dealId}`,
        );

      return {
        status: true,
        message: `Deal was added in queue: ${dealId}`,
      };
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * Handle deals for upsells
   *
   * ---
   *
   * Обрабатывает сделки для допродажи
   * @param date
   */
  public async handleUpsellDeals(date: Date = new Date()) {
    try {
      const upsells = await this.getUpsells({
        where: {
          status: B24LeadUpsellStatuses.PENDING,
          dateNotify: date,
        },
      });

      if (upsells.length === 0) {
        return {
          status: true,
          message: 'Nothing to notify',
        };
      }

      const missingDeals = new Set<string>();
      upsells.forEach(({ id, leadId, dealId, category, dealStage }) => {
        if (category === B24DealCategories.UNKNOWN) {
          // Ловим необработанные лиды
          missingDeals.add(leadId);
          return;
        }

        this.queueLightService.addTaskHandleUpsellDeal({
          upsellId: id,
          leadId: leadId,
          dealId: dealId,
          category: category,
          dealStage: dealStage,
        });
      });

      return {
        status: true,
        message: 'Upsells was successfully added in handle queue',
        queued_deals: upsells.map((upsell) => upsell.dealId),
        queued_deals_count: upsells.length,
        missing_deals: [...missingDeals],
        missing_deals_count: missingDeals.size,
      };
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * Distribute handle upsell by deals category
   *
   * ---
   *
   * Распределяет обработку допродажи по категориям
   * @param fields
   */
  public async handleTaskUpsellDeal(fields: QueueLightAddTaskHandleUpsellDeal) {
    switch (fields.category) {
      case B24DealCategories.SITE:
        return this.handleUpsellSiteDeal(fields);

      case B24DealCategories.ADVERT:
        return this.handleUpsellAdvertDeal(fields);

      case B24DealCategories.SEO:
        return this.handleUpsellSeoDeal(fields);

      default:
        return `Not handle: Nothing to notify: ${fields.dealId}`;
    }
  }

  /**
   * Handle SITE deals
   *
   * ---
   *
   * Обработка САЙТ сделки
   * @private
   * @param fields
   */
  private async handleUpsellSiteDeal(
    fields: QueueLightAddTaskHandleUpsellDeal,
  ) {
    const { dealId } = fields;
    const deal = await this.bitrixDeals.getDealById(dealId);

    if (!deal) throw new NotFoundException(`Deal not found: ${dealId}`);

    const dealServiceAdvert = deal?.UF_CRM_1728464737895; // РК
    const dealServiceSeo = deal?.UF_CRM_1728464762416; // SEO

    if (!dealServiceAdvert || !dealServiceSeo)
      throw new BadRequestException(
        `Invalid get services from deal: ${dealId}`,
      );

    const body: B24HandleUpsellOptions = {
      ...fields,
      messages: {
        working: '',
        notWorking: '',
        fired: '',
      },
    };

    switch (true) {
      case dealServiceAdvert == '1' && dealServiceSeo == '1':
        return `Nothing upsells: ${dealId}`;

      case dealServiceAdvert == '1':
        body.messages.working =
          'Завершена разработка сайта. Необходимо допродать Клиенту SEO[br]';
        body.messages.notWorking =
          'Менеджер отсутствует. Необходимо распределить сделку на допродажу SEO[br]';
        body.messages.fired =
          'Менеджер уволен. Необходимо распределить сделку на допродажу SEO[br]';
        break;

      case dealServiceSeo == '1':
        body.messages.working =
          'Завершена разработка сайта. Необходимо допродать Клиенту РК[br]';
        body.messages.notWorking =
          'Менеджер отсутствует. Необходимо распределить сделку на допродажу РК[br]';
        body.messages.fired =
          'Менеджер уволен. Необходимо распределить сделку на допродажу РК[br]';
        break;

      case dealServiceAdvert == '0' && dealServiceSeo == '0':
        body.messages.working =
          'Завершена разработка сайта. Необходимо допродать Клиенту РК/SEO[br]';
        body.messages.notWorking =
          'Менеджер отсутствует. Необходимо распределить сделку на допродажу РК/SEO[br]';
        body.messages.fired =
          'Менеджер уволен. Необходимо распределить сделку на допродажу РК/SEO[br]';
        break;

      default:
        return `Not handle site deal: ${dealId}`;
    }

    return this.handleUpsellDeal(body);
  }

  /**
   * Handle ADVERT deals
   *
   * ---
   *
   * Обработка РЕКЛАМНОЙ сделки
   * @private
   * @param fields
   */
  private async handleUpsellAdvertDeal(
    fields: QueueLightAddTaskHandleUpsellDeal,
  ) {
    const { dealId, dealStage } = fields;
    const deal = await this.bitrixDeals.getDealById(dealId, 'force');

    if (!deal) throw new NotFoundException(`Deal not found: ${dealId}`);

    const { UF_CRM_1759745238148: site } = deal;

    if (!site)
      throw new BadRequestException(`Invalid get field from deal: ${dealId}`);

    const body: B24HandleUpsellOptions = {
      ...fields,
      messages: {
        working: '',
        notWorking: '',
        fired: '',
      },
    };

    // Рекламируем/Продвигаем
    if (site == '12150') {
      // Наш сайт
      switch (dealStage) {
        case 'C10:UC_18Z2XB': // Стадия: Пауза
          body.messages.working =
            'Реклама ушла в паузу. Необходимо допродать Клиенту SEO[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Реклама в паузе, необходимо распределить сделку на допродажу SEO[br]';
          body.messages.fired =
            'Менеджер уволен. Реклама в паузе, необходимо распределить сделку на допродажу SEO[br]';

          if (deal?.UF_CRM_1759742579435 == '12144')
            return `Negative client: ${dealId}`;

          break;

        case 'C10:UC_4Q98WJ': // Стадия: 3-й мес. ведения
          body.messages.working =
            'Сделка в работе по РК более 3х месяцев. Необходимо допродать Клиенту SEO[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Сделка в работе по РК, необходимо распределить сделку на допродажу[br]';
          body.messages.fired =
            'Менеджер уволен. Сделка в работе по РК, необходимо распределить сделку на допродажу SEO[br]';
          body.messages.additionalMessage = {
            dialogId: deal.UF_CRM_1638351463, // кто ведет
            message:
              'Сделка в работе по РК более 3х месяцев. Лид передан на допродажу SEO, учитывай в работе[br]',
          };
          break;

        default:
          return `Deal advert was not handled stage in our site: ${dealId}`;
      }
    } else if (site == '12152') {
      // Не наш сайт
      switch (dealStage) {
        case 'C10:UC_18Z2XB': // Стадия: Пауза
          body.messages.working =
            'Реклама ушла в паузу. Необходимо допродать Клиенту SEO[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Реклама в паузе, необходимо распределить сделку на допродажу SEO[br]';
          body.messages.fired =
            'Менеджер уволен. Реклама в паузе, необходимо распределить сделку на допродажу SEO[br]';

          if (
            deal?.UF_CRM_1759742579435 == '12144' ||
            deal?.UF_CRM_1626852039 == '12154'
          )
            return 'Negative client or external site';
          break;

        case 'C10:UC_4Q98WJ': // Стадия: 3-й мес. ведения
          body.messages.working =
            'Сделка в работе по РК более 3х месяцев. Необходимо допродать Клиенту SEO[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Сделка в работе по РК, необходимо распределить сделку на допродажу[br]';
          body.messages.fired =
            'Сделка в работе по РК, необходимо распределить сделку на допродажу SEO[br]';
          body.messages.additionalMessage = {
            dialogId: deal.UF_CRM_1638351463, // кто ведет
            message:
              'Сделка в работе по РК более 3х месяцев. Лид передан на допродажу SEO, учитывай в работе[br]',
          };
          break;

        default:
          return `Deal advert was not handle stage: ${dealId}`;
      }
    }

    return this.handleUpsellDeal(body);
  }

  /**
   * Handle SEO deals
   *
   * ---
   *
   * Обработка SEO сделки
   * @private
   * @param fields
   */
  private async handleUpsellSeoDeal(fields: QueueLightAddTaskHandleUpsellDeal) {
    const { dealId, dealStage } = fields;
    const deal = await this.bitrixDeals.getDealById(dealId);

    if (!deal) throw new NotFoundException(`Deal not found: ${dealId}`);

    const {
      UF_CRM_1759745238148: site,
      UF_CRM_1623766928: assignedSeoSpecialist,
    } = deal;

    const body: B24HandleUpsellOptions = {
      ...fields,
      messages: {
        working: '',
        notWorking: '',
        fired: '',
      },
    };

    if (site == '12150') {
      // Наш сайт
      switch (dealStage) {
        case 'C34:UC_XKO890': // Пауза
          body.messages.working =
            'SEO ушло в паузу. Необходимо допродать Клиенту РК[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. SEO в паузе, необходимо распределить сделку на допродажу РК[br]';
          body.messages.fired =
            'Менеджер уволен. SEO в паузе, необходимо распределить сделку на допродажу РК[br]';
          body.messages.additionalMessage = {
            dialogId: assignedSeoSpecialist, // Ответственный SEO специалист
            message:
              'Сделка в работе по Базовой SEO ушла в паузу. Лид передан на допродажу РК, учитывай в работе[br]',
          };
          break;

        case 'C34:WON': // Завершена
          body.messages.working =
            'Завершена работа по базовой SEO-оптимизации. Необходимо допродать Клиенту РК[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Завершена работа по SEO, необходимо распределить сделку на допродажу РК[br]';
          body.messages.fired =
            'Менеджер уволен. Завершена работа по SEO, необходимо распределить сделку на допродажу[br]';
          body.messages.additionalMessage = {
            dialogId: assignedSeoSpecialist, // Ответственный SEO специалист
            message:
              'Сделка в работе по Базовой SEO завершена. Лид передан на допродажу РК, учитывай в работе[br]',
          };
          break;

        case 'C7:1': // SEO продано. Но сайт в разработке
          body.messages.working =
            'Сделка в работе по SEO. Необходимо допродать Клиенту РК[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Сделка в работе по SEO, необходимо распределить сделку на допродажу РК[br]';
          body.messages.fired =
            'Менеджер уволен. Сделка в работе по SEO, необходимо распределить сделку на допродажу РК[br]';
          body.messages.additionalMessage = {
            dialogId: assignedSeoSpecialist,
            message:
              'Сделка в работе по SEO. Лид передан на допродажу РК, учитывай в работе[br]',
          };
          break;

        default:
          return `Not handle seo deal: ${dealId}`;
      }
    } else if (site == '12152') {
      // Не наш сайт

      switch (dealStage) {
        case 'C7:1': // SEO продано. Но сайт в разработке
          return 'Not handle';

        case 'C16:UC_P9BAQW': // Внешнее SEO продано
          body.messages.working =
            'Сделка в работе по SEO. Необходимо допродать Клиенту РК[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Сделка в работе по SEO, необходимо распределить сделку на допродажу РК[br]';
          body.messages.fired =
            'Менеджер уволен. Сделка в работе по SEO, необходимо распределить сделку на допродажу РК[br]';
          body.messages.additionalMessage = {
            dialogId: assignedSeoSpecialist,
            message:
              'Сделка в работе по SEO. Лид передан на допродажу РК, учитывай в работе[br]',
          };
          break;

        case 'C16:NEW': // 3й месяц продвижения
          body.messages.working =
            'Сделка в работе по SEO. Необходимо допродать Клиенту РК[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Сделка в работе по SEO, необходимо распределить сделку на допродажу РК[br]';
          body.messages.fired =
            'Менеджер уволен. Сделка в работе по SEO, необходимо распределить сделку на допродажу РК[br]';
          body.messages.additionalMessage = {
            dialogId: assignedSeoSpecialist,
            message:
              'Сделка в работе на 3-м месяце продвижения. Лид передан на допродажу РК, учитывай в работе[br]',
          };
          break;

        case 'C16:UC_W95NWK': // Пауза временно
          body.messages.working =
            'SEO ушло в паузу. Необходимо допродать Клиенту РК[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. SEO в паузе, необходимо распределить сделку на допродажу РК[br]';
          body.messages.fired =
            'Менеджер уволен. SEO в паузе, необходимо распределить сделку на допродажу РК[br]';
          body.messages.additionalMessage = {
            dialogId: assignedSeoSpecialist,
            message:
              'Сделка в работе по Внешнему SEO ушла в паузу. Лид передан на допродажу РК, учитывай в работе[br]',
          };
          break;

        case 'C34:WON': // Завершена
          body.messages.working =
            'Завершена работа по базовой SEO-оптимизации. Необходимо допродать Клиенту РК[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. Завершена работа по SEO, необходимо распределить сделку на допродажу РК[br]';
          body.messages.fired =
            'Менеджер уволен. Завершена работа по SEO, необходимо распределить сделку на допродажу[br]';
          body.messages.additionalMessage = {
            dialogId: assignedSeoSpecialist,
            message:
              'Сделка в работе по SEO завершена. Лид передан на допродажу РК, учитывай в работе[br]',
          };
          break;

        case 'C34:UC_XKO890': // Пауза
          body.messages.working =
            'SEO ушло в паузу. Необходимо допродать Клиенту РК[br]';
          body.messages.notWorking =
            'Менеджер отсутствует. SEO в паузе, необходимо распределить сделку на допродажу РК[br]';
          body.messages.fired =
            'Менеджер уволен. SEO в паузе, необходимо распределить сделку на допродажу РК[br]';
          body.messages.additionalMessage = {
            dialogId: assignedSeoSpecialist,
            message:
              'Сделка в работе по SEO ушла в паузу. Лид передан на допродажу РК, учитывай в работе[br]',
          };
          break;

        default:
          return `Not handle seo deal: ${dealId}`;
      }
    }

    return this.handleUpsellDeal(body);
  }

  /**
   * Notify manager and send message in chat
   *
   * ---
   *
   * Уведомляет менеджера и отправляет сообщение в чат
   * @private
   * @param fields
   */
  private async handleUpsellDeal(fields: B24HandleUpsellOptions) {
    const { upsellId, dealId, leadId, messages, category } = fields;

    // Получаем информацию с битрикса
    const {
      result: {
        result: {
          get_deal: deal,
          get_assigned: [manager],
          get_assigned_head: [managerDepartment],
          get_deal_fields: dealFields,
        },
      },
    } = await this.bitrixService.callBatch<{
      get_deal: B24Deal;
      get_assigned: B24User[];
      get_assigned_head: B24Department[];
      get_deal_fields: B24DealFields;
    }>({
      get_deal: {
        method: 'crm.deal.get',
        params: {
          id: dealId,
        },
      },
      get_assigned: {
        method: 'user.get',
        params: {
          filter: {
            ID: '$result[get_deal][ASSIGNED_BY_ID]',
          },
        },
      },
      get_assigned_head: {
        method: 'department.get',
        params: {
          ID: '$result[get_assigned][0][UF_DEPARTMENT][0]',
        },
      },
      get_deal_fields: {
        method: 'crm.deal.fields',
        params: {},
      },
    });

    if (!deal || !managerDepartment)
      throw new BadRequestException(
        `Invalid get deal and head user info: ${dealId}`,
      );

    if (!(category.toUpperCase() in this.upsellQuestionFields))
      throw new BadRequestException(`Invalid category: ${dealId}`);

    let leadComment = '';
    let notifyMessage = `[b]Допродажа[/b][br][user=${managerDepartment.UF_HEAD}][/user][br][br]`;

    // формируем комментарий для лида
    this.upsellQuestionFields[category.toUpperCase()]?.fields.forEach(
      (field) => {
        if (!(field in deal)) return;

        leadComment += `${dealFields[field].listLabel ?? ''}: [b]${deal[field]}[/b]\n`;
      },
    );

    const batchCommandsNotify: B24BatchCommands = {
      update_lead: {
        method: 'crm.lead.update',
        params: {
          id: leadId,
          fields: {
            STATUS_ID: B24LeadConvertedStages[2], // Стадия: Допродажа действующему
          },
        },
      },
      lead_comment_add: {
        method: 'crm.timeline.comment.add',
        params: {
          fields: {
            ENTITY_ID: leadId,
            ENTITY_TYPE: 'lead',
            COMMENT: leadComment,
            AUTHOR_ID: deal.ASSIGNED_BY_ID,
          },
        },
      },
      lead_comment_pin: {
        method: 'crm.timeline.item.pin',
        params: {
          id: '$result[lead_comment_add]',
          ownerTypeId: 1,
          ownerId: leadId,
        },
      },
      update_deal: {
        method: 'crm.deal.update',
        params: {
          id: dealId,
          fields: {
            UF_CRM_1760001386: new Date(), // Дата перехода в допродажу
          },
        },
      },
    };
    const salesList = await this.wikiService.getWorkingSales(true);
    let notifyManagerMessage: string | undefined;

    if (!manager.ACTIVE) {
      // Если менеджер уволен
      notifyMessage += messages.fired;
    } else if (!salesList.includes(manager.ID)) {
      // Если менеджер не начал рабочий день
      notifyMessage += messages.notWorking;
    } else {
      notifyManagerMessage =
        '[b]Допродажа[/b][br][br]' +
        messages.working +
        this.bitrixService.generateLeadUrl(leadId) +
        '[br]' +
        this.bitrixService.generateDealUrl(dealId);

      batchCommandsNotify['upsell_notify_manager'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: manager.ID,
          MESSAGE: notifyManagerMessage,
        },
      };

      batchCommandsNotify['upsell_log'] = {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixService.getConstant('BOT_ID'),
          DIALOG_ID: this.bitrixService.getConstant('LEAD').upsellChatId,
          MESSAGE:
            notifyMessage +
            '[i]Менеджеру отправлено сообщение по допродаже:[/i][br][br]' +
            notifyManagerMessage,
        },
      };
    }

    notifyMessage +=
      this.bitrixService.generateLeadUrl(leadId) +
      '[br]' +
      this.bitrixService.generateDealUrl(dealId);

    if (!notifyManagerMessage) {
      batchCommandsNotify['upsell_notify_chat'] = {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixService.getConstant('BOT_ID'),
          DIALOG_ID: this.bitrixService.getConstant('LEAD').upsellChatId,
          MESSAGE: notifyMessage,
        },
      };
    }

    if (messages.additionalMessage) {
      batchCommandsNotify['upsell_notify_additional_manager'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: messages.additionalMessage.dialogId,
          MESSAGE: messages.additionalMessage.message,
        },
      };
    }

    Promise.all([
      this.bitrixService.callBatch(batchCommandsNotify),
      this.updateUpsell(upsellId, {
        status: B24LeadUpsellStatuses.COMPLETED,
      }),
    ])
      .then((result) => {
        this.logger.debug({
          message: 'Final upsell steps',
          request: batchCommandsNotify,
          response: result,
        });
      })
      .catch((error) => {
        this.logger.error({
          message: 'Invalid on final upsell steps',
          request: batchCommandsNotify,
          error,
        });
      });

    return { status: true, message: `Was successfully sending: ${dealId}` };
  }
}
