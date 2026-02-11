import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixLeadsPort } from '@/modules/bitrix/application/ports/leads/leads.port';
import {
  B24ActionType,
  B24BatchCommands,
  B24ListParams,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import {
  B24Lead,
  B24LeadActivities,
  B24LeadStatus,
} from '@/modules/bitrix/application/interfaces/leads/lead.interface';
import { B24LeadUpdateFields } from '@/modules/bitrix/application/interfaces/leads/lead-update.interface';
import {
  LeadAvitoStatus,
  LeadAvitoStatusResponse,
} from '@/modules/bitrix/application/interfaces/leads/lead-avito-status.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import {
  B24LeadActiveStages,
  B24LeadConvertedStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/application/constants/leads/lead.constants';
import { B24StageHistoryItem } from '@/modules/bitrix/interfaces/bitrix-stagehistory.interface';
import {
  LeadManagerCallingDto,
  LeadObserveManagerCallingItemDto,
} from '@/modules/bitrix/application/dtos/leads/lead-manager-calling.dto';
import {
  LeadObserveManagerCallingCreationalAttributes,
  LeadObserveManagerCallingLeadBitrixItem,
} from '@/modules/bitrix/application/interfaces/leads/lead-observe-manager-calling.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { isAxiosError } from 'axios';
import { LeadObserveManagerCallingModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-observe-manager-calling.entity';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import type { BitrixLeadsManagerCallingRepositoryPort } from '@/modules/bitrix/application/ports/leads/leads-manager-calling.port';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import dayjs from 'dayjs';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { BitrixLeadsObserveActiveCallsLeadsNotFoundOptions } from '@/modules/bitrix/application/interfaces/leads/lead-observe-active-calls.interface';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { getNoun } from '@/common/functions/get-noun';
import { TelphinCallOptions } from '@/modules/telphin/interfaces/telpgin-calls.interface';
import { B24User } from '@/modules/bitrix/application/interfaces/users/user.interface';
import { B24Department } from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import { BitrixSyncCalls } from '@/modules/bitrix/application/interfaces/leads/lead-sync-calls.interface';
import { BITRIX_LIMIT_REQUESTS } from '@/modules/bitrix/application/constants/common/bitrix.constants';
import { B24Activity } from '@/modules/bitrix/application/interfaces/activities/activities.interface';
import type { BitrixUsersPort } from '@/modules/bitrix/application/ports/users/users.port';
import { WikiService } from '@/modules/wiki/wiki.service';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(isBetween);

@Injectable()
export class BitrixLeadsUseCase {
  private readonly logger = new WinstonLogger(
    BitrixLeadsUseCase.name,
    'bitrix:leads'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.LEADS.LEADS_DEFAULT)
    private readonly leads: BitrixLeadsPort,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(B24PORTS.LEADS.MANAGER_CALLING_REPOSITORY)
    private readonly bitrixManagerCallingRepository: BitrixLeadsManagerCallingRepositoryPort,
    private readonly telphinService: TelphinService,
    private readonly redisService: RedisService,
    @Inject(B24PORTS.USERS.USERS_DEFAULT)
    private readonly bitrixUsers: BitrixUsersPort,
    private readonly wikiService: WikiService,
  ) {}

  async getLeadById(leadId: string) {
    return this.leads.getLeadById(leadId);
  }

  async getLeads(params: B24ListParams<B24Lead>) {
    return this.leads.getLeads(params);
  }

  async createLead(fields: Partial<B24Lead>) {
    return this.leads.createLead(fields);
  }

  async updateLead(fields: B24LeadUpdateFields) {
    return this.leads.updateLead(fields);
  }

  async getDuplicateLeadsByPhone(
    phone: string | string[],
    action: B24ActionType = 'cache',
  ) {
    return this.leads.getDuplicateLeadsByPhone(phone, action);
  }

  /**
   * Get lead list by date and define his statuses
   *
   * ---
   *
   * Получение списка лидов за определенную дату и определение их статусов
   *
   *
   * @param date
   */
  public async getLeadsStatusesByDate(
    date: Date,
  ): Promise<LeadAvitoStatusResponse> {
    try {
      const filterLeadsByDate = {
        '!UF_CRM_1713765220416': '', // Подменный номер авито
        '>=DATE_CREATE': `${date.toLocaleDateString()}T00:00:00`, // Дата создания
        '<=DATE_CREATE': `${date.toLocaleDateString()}T23:59:59`, // Дата создания
      };
      const filterLeadsByDateRequest = {
        '!UF_CRM_1713765220416': '', // Подменный номер авито
        '>=UF_CRM_1715671150': `${date.toLocaleDateString()}T00:00:00`, // Дата последнего обращения
        '<=UF_CRM_1715671150': `${date.toLocaleDateString()}T23:59:59`, // Дата последнего обращения
      };
      const selectLeadFields = [
        'ID',
        'UF_CRM_1712667568', // С какого авито обащение
        'UF_CRM_1713765220416', // Подменный номер авито
        'DATE_CREATE', // Дата создания лида
        'UF_CRM_1715671150', // Дата последнего обращения
        'STATUS_ID', // Стадия
      ];

      const { result: batchResponseGetTotalLeads } =
        await this.bitrixService.callBatch<{
          get_leads_by_date: B24Lead[];
          get_leads_by_date_request: B24Lead[];
        }>({
          get_leads_by_date: {
            method: 'crm.lead.list',
            params: {
              filter: filterLeadsByDate,
              select: selectLeadFields,
              start: 0,
            },
          },
          get_leads_by_date_request: {
            method: 'crm.lead.list',
            params: {
              filter: filterLeadsByDateRequest,
              select: selectLeadFields,
              start: 0,
            },
          },
        });

      const {
        get_leads_by_date: totalLeadsByDate,
        get_leads_by_date_request: totalLeadsByDateRequest,
      } = batchResponseGetTotalLeads.result_total;

      const batchCommandsGetLeads = new Map<number, B24BatchCommands>();
      const batchQueriesByDate = Math.ceil(totalLeadsByDate / 50);
      const batchQueriesByDateRequest = Math.ceil(totalLeadsByDateRequest / 50);
      let index = 0;

      for (let i = 1; i <= batchQueriesByDate; i++) {
        let cmds = batchCommandsGetLeads.get(index) ?? {};

        if (Object.keys(cmds).length === 50) {
          index++;
          cmds = batchCommandsGetLeads.get(index) ?? {};
        }
        cmds[`get_leads_by_date-${i}`] = {
          method: 'crm.lead.list',
          params: {
            filter: filterLeadsByDate,
            select: selectLeadFields,
            start: (i - 1) * 50,
          },
        };

        batchCommandsGetLeads.set(index, cmds);
      }

      for (let i = 1; i <= batchQueriesByDateRequest; i++) {
        let cmds = batchCommandsGetLeads.get(index) ?? {};

        if (Object.keys(cmds).length === 50) {
          index++;
          cmds = batchCommandsGetLeads.get(index) ?? {};
        }

        cmds[`get_leads_by_date_request-${i}`] = {
          method: 'crm.lead.list',
          params: {
            filter: filterLeadsByDateRequest,
            select: selectLeadFields,
            start: (i - 1) * 50,
          },
        };

        batchCommandsGetLeads.set(index, cmds);
      }

      const leadsMap = new Map<string, LeadAvitoStatus>();
      const batchCommandsGetLeadStageHistory = new Map<
        number,
        B24BatchCommands
      >();
      const responses = await Promise.all<
        Promise<B24BatchResponseMap<Record<string, B24Lead[]>>>[]
      >(
        Array.from(batchCommandsGetLeads.values()).map((cmds) =>
          this.bitrixService.callBatch(cmds),
        ),
      );

      if (
        responses.length === 0 ||
        Object.keys(responses[0].result.result).length === 0
      ) {
        return {
          count_leads: 0,
          leads: {},
        };
      }

      index = 0;
      responses.map(({ result }) => {
        Object.entries(result.result).forEach(([_, leads]) => {
          leads.forEach(
            ({
              ID: leadId,
              DATE_CREATE,
              STATUS_ID: statusId,
              UF_CRM_1713765220416: avitoPhone = '',
              UF_CRM_1712667568: avitoName = '',
              UF_CRM_1715671150: dateLastRequest = '',
            }) => {
              if (leadsMap.has(leadId)) return;
              let leadStatus = B24LeadStatus.UNKNOWN;

              const dateCreate = new Date(DATE_CREATE);

              switch (true) {
                // Если лид в активных стадиях
                case B24LeadActiveStages.includes(statusId) &&
                  dateCreate.toLocaleDateString() !== date.toLocaleDateString():
                  leadStatus = B24LeadStatus.ACTIVE;
                  break;

                // Если лид в неактивных стадиях
                case B24LeadRejectStages.includes(statusId) &&
                  dateCreate.toLocaleDateString() !== date.toLocaleDateString():
                  leadStatus = B24LeadStatus.NONACTIVE;
                  break;

                // Если лид в новых стадиях
                case dateCreate.toLocaleDateString() ===
                  date.toLocaleDateString() ||
                  (B24LeadNewStages.includes(statusId) &&
                    dateCreate.toLocaleDateString() !==
                      date.toLocaleDateString()):
                  leadStatus = B24LeadStatus.NEW;
                  break;

                // Если лид в завершающих стадиях
                case B24LeadConvertedStages.includes(statusId):
                  leadStatus = B24LeadStatus.FINISH;
                  break;
              }

              leadsMap.set(leadId, {
                avito_name: avitoName,
                date_cerate: dateCreate.toISOString(),
                avito_number: avitoPhone,
                date_last_request: dateLastRequest,
                status: leadStatus,
              });

              let cmds = batchCommandsGetLeadStageHistory.get(index) ?? {};
              if (Object.keys(cmds).length === 50) {
                index++;
                cmds = batchCommandsGetLeadStageHistory.get(index) ?? {};
              }

              cmds[`get_lead_history-${leadId}`] = {
                method: 'crm.stagehistory.list',
                params: {
                  entityTypeId: 1,
                  filter: {
                    OWNER_ID: leadId,
                  },
                  order: {
                    CREATED_TIME: 'DESC',
                  },
                  select: ['CREATED_TIME', 'OWNER_ID', 'STATUS_ID'],
                },
              };

              batchCommandsGetLeadStageHistory.set(index, cmds);
            },
          );
        });
      });

      const batchResponseGetLeadHistory = await Promise.all<
        Promise<
          B24BatchResponseMap<
            Record<
              string,
              {
                items: Pick<
                  B24StageHistoryItem,
                  'CREATED_TIME' | 'OWNER_ID' | 'STATUS_ID'
                >[];
              }
            >
          >
        >[]
      >(
        Array.from(batchCommandsGetLeadStageHistory.values()).map((cmds) =>
          this.bitrixService.callBatch(cmds),
        ),
      );

      batchResponseGetLeadHistory.forEach((batchResponse) => {
        Object.entries(batchResponse.result.result).forEach(
          ([commandName, { items: leadStageHistory }]) => {
            const leadId = commandName.split('-')[1];
            const lead = leadsMap.get(leadId);

            if (
              !lead ||
              new Date(lead.date_cerate).toISOString() === date.toISOString() ||
              leadStageHistory.length < 2
            )
              return;

            switch (true) {
              case B24LeadRejectStages.includes(leadStageHistory[1].STATUS_ID):
                lead.status = B24LeadStatus.NONACTIVE;
                break;

              case B24LeadNewStages.includes(leadStageHistory[1].STATUS_ID):
                lead.status = B24LeadStatus.ACTIVE;
                break;
            }

            leadsMap.set(leadId, lead);
          },
        );
      });

      const response = {
        count_leads: leadsMap.size,
        leads: Array.from(leadsMap.entries()).reduce(
          (acc, [leadId, leadData]) => {
            acc[leadId] = leadData;
            return acc;
          },
          {},
        ),
      };

      this.logger.debug({
        handler: this.getLeadsStatusesByDate.name,
        fields: date,
        response,
      });

      return response;
    } catch (error) {
      this.logger.error({
        handler: this.getLeadsStatusesByDate.name,
        fields: date,
        error,
      });
      throw error;
    }
  }

  public async handleObserveManagerCallingOld({
    calls,
  }: LeadManagerCallingDto) {
    const batchCommandsGetLeads = new Map<number, B24BatchCommands>();
    const updatedLeads = new Set<string>();
    const missingLeads = new Set<string>();
    const notifiedLeads = new Set<string>();
    const deletedLeads = new Set<string>();
    let batchIndex = 0;
    const errors: string[] = [];
    const uniqueCalls = new Map<string, LeadObserveManagerCallingItemDto>();

    // Делаем номера уникальными
    calls.forEach((call) =>
      uniqueCalls.set(call.phone, { ...call, date: new Date(call.date) }),
    );

    // Собираем батч запрос для поиска лидов по номеру телефона и получения информации по лиду
    Array.from(uniqueCalls.values()).forEach(({ phone, date }) => {
      let cmds = batchCommandsGetLeads.get(batchIndex) ?? {};
      const clearPhone = phone.replaceAll(/ -/g, '');

      if (Object.keys(cmds).length === 50) {
        batchCommandsGetLeads.set(batchIndex, cmds);
        batchIndex++;
        cmds = batchCommandsGetLeads.get(batchIndex) ?? {};
      }

      cmds[`find_lead=${clearPhone}`] = {
        method: 'crm.duplicate.findbycomm',
        params: {
          entity_type: 'LEAD',
          type: 'PHONE',
          values: [phone],
        },
      };

      if (Object.keys(cmds).length === 50) {
        batchCommandsGetLeads.set(batchIndex, cmds);
        batchIndex++;
        cmds = batchCommandsGetLeads.get(batchIndex) ?? {};
      }

      cmds[`get_lead_info=${clearPhone}=${date.getTime()}`] = {
        method: 'crm.lead.list',
        params: {
          filter: {
            ID: `$result[find_lead=${clearPhone}][LEAD][0]`,
            '@STATUS_ID': B24LeadActiveStages,
          },
          select: ['ID', 'TITLE', 'ASSIGNED_BY_ID', 'STATUS_ID', 'PHONE'],
          start: 0,
        },
      };

      batchCommandsGetLeads.set(batchIndex, cmds);
    });

    // Выполняем запрос
    let batchResponseDictionary: B24BatchResponseMap<
      Record<string, { LEAD: number[] } | []> & Record<string, B24Lead[]>
    >[];

    // Обработка ошибок
    try {
      batchResponseDictionary = await Promise.all<
        Promise<
          B24BatchResponseMap<
            Record<string, { LEAD: number[] } | []> & Record<string, B24Lead[]>
          >
        >[]
      >(
        Array.from(batchCommandsGetLeads.values()).map((batchCommands) =>
          this.bitrixService.callBatch(batchCommands),
        ),
      );
    } catch (err) {
      this.logger.error({
        message: 'Error on find leads by phone',
        error: isAxiosError(err) ? err.response : err,
      });
      throw err;
    }

    const leadsFromBitrix = new Map<
      string,
      LeadObserveManagerCallingLeadBitrixItem
    >();

    // Проходимся по результату получения информации и лидах и заполняем leadsFromBitrix
    batchResponseDictionary.forEach((b24Response) => {
      const batchErrors = Object.values(b24Response.result.result_error);
      if (batchErrors.length !== 0) {
        batchErrors.forEach(({ error }) => errors.push(error));
        return;
      }

      if (
        Array.isArray(b24Response.result.result) &&
        b24Response.result.result.length === 0
      )
        return;

      Object.entries(b24Response.result.result).forEach(([command, result]) => {
        const [commandName, phone, date] = command.split('=');

        switch (commandName) {
          case 'find_lead':
            return;

          case 'get_lead_info':
            if (result.length === 0) return;

            const {
              ID: leadId,
              STATUS_ID: status,
              ASSIGNED_BY_ID: assigned,
            } = result[0];

            if (leadsFromBitrix.has(leadId)) return;

            leadsFromBitrix.set(leadId, {
              id: leadId,
              phone: phone,
              status: status,
              assigned: assigned,
              dateCalling: new Date(Number(date)),
            });
            break;
        }
      });
    });

    // Если есть ошибки выводим их
    if (errors.length !== 0)
      throw new BadRequestException(
        `Exception error on batch request: get leads by phone: ${errors.join(', ')}`,
      );

    // Обновляем записи в БД в соответствии с полученной информацией по лидам
    const updateLeadsResponse =
      await this.updateOrAddOnDBLeadsObserveManagerCalling(
        Array.from(leadsFromBitrix.values()),
      );

    updateLeadsResponse.forEach(({ leadId }) => updatedLeads.add(leadId));

    // Получаем лиды из базы, у которых дата звонка больше 7 дней
    const leadsFromDBWhichManagerDoesntCalling: Pick<
      LeadObserveManagerCallingModel,
      'id' | 'leadId' | 'dateCalling'
    >[] = await this.bitrixManagerCallingRepository.getCallList({
      where: {
        dateCalling: {
          [Op.lte]: Sequelize.literal("NOW() - INTERVAL '6d'"),
        },
      },
      attributes: ['id', 'leadId', 'dateCalling'],
    });

    // Если не нашли в базе лидов: выходим
    if (leadsFromDBWhichManagerDoesntCalling.length === 0)
      return {
        message: 'Not found leads',
        status: true,
        data: {
          notifiedLeads: [...notifiedLeads],
          missingLeads: [...missingLeads],
          updatedLeads: [...updatedLeads],
          deletedLeads: [...deletedLeads],
        },
        total: {
          notifiedLeads: notifiedLeads.size,
          missingLeads: missingLeads.size,
          updatedLeads: updatedLeads.size,
          deletedLeads: deletedLeads.size,
          uniqueLeads: uniqueCalls.size,
        },
      };

    // Проходимся по списку найденных лидов и собираем пакет запросов для проверки активных лидов
    const batchCommandsGetActiveLeads = new Map<number, B24BatchCommands>();
    batchIndex = 0;
    leadsFromDBWhichManagerDoesntCalling.forEach(({ leadId }) => {
      let cmds = batchCommandsGetActiveLeads.get(batchIndex) ?? {};

      if (Object.keys(cmds).length === 50) {
        batchCommandsGetActiveLeads.set(batchIndex, cmds);
        batchIndex++;
        cmds = batchCommandsGetActiveLeads.get(batchIndex) ?? {};
      }

      cmds[`check_active_lead=${leadId}`] = {
        method: 'crm.lead.list',
        params: {
          filter: {
            ID: leadId,
            '@STATUS_ID': B24LeadActiveStages,
          },
          select: ['ID'],
          start: 0,
        },
      };
      batchCommandsGetActiveLeads.set(batchIndex, cmds);
    });

    // Делаем запрос в битрикс для фильтрации активных лидов с базы
    let batchResponseGetActiveLeads: B24BatchResponseMap<B24Lead[]>[];

    // Обработка ошибок
    // Делаем запрос
    try {
      batchResponseGetActiveLeads = await Promise.all<
        Promise<B24BatchResponseMap<B24Lead[]>>[]
      >(
        Array.from(batchCommandsGetActiveLeads.values()).map((cmds) =>
          this.bitrixService.callBatch(cmds),
        ),
      );
    } catch (err) {
      return {
        status: false,
        message: `Exception error on get active leads by phone from DB. ${err.message}`,
        data: {
          notifiedLeads: [...notifiedLeads],
          missingLeads: [...missingLeads],
          updatedLeads: [...updatedLeads],
          deletedLeads: [...deletedLeads],
        },
        total: {
          notifiedLeads: notifiedLeads.size,
          missingLeads: missingLeads.size,
          updatedLeads: updatedLeads.size,
          deletedLeads: deletedLeads.size,
          uniqueLeads: uniqueCalls.size,
        },
      };
    }

    // Проходимся по результату и записываем активные лиды
    const leadsNeedNotify = new Set<string>();
    batchResponseGetActiveLeads.forEach((b24Response) => {
      const batchErrors = Object.values(b24Response.result.result_error);
      if (batchErrors.length !== 0) {
        batchErrors.forEach(({ error }) => errors.push(error));
        return;
      }

      Object.entries(b24Response.result.result).forEach(([command, result]) => {
        if (!result || result.length === 0) {
          const [, leadId] = command.split('=');
          deletedLeads.add(leadId);
          return;
        }

        leadsNeedNotify.add(result[0].ID);
      });
    });

    // Если есть ошибки выводим их
    if (errors.length !== 0)
      return {
        message: `Exception error on get active leads by phone from DB: ${errors.join(', ')}`,
        status: false,
      };

    // Если нет лидов выходим
    if (leadsNeedNotify.size === 0)
      return {
        message: 'Leads updated successfully',
        status: true,
        data: {
          notifiedLeads: [...notifiedLeads],
          missingLeads: [...missingLeads],
          updatedLeads: [...updatedLeads],
          deletedLeads: [...deletedLeads],
        },
        total: {
          notifiedLeads: notifiedLeads.size,
          missingLeads: missingLeads.size,
          updatedLeads: updatedLeads.size,
          deletedLeads: deletedLeads.size,
          uniqueLeads: uniqueCalls.size,
        },
      };

    // Проходимся по списку найденных лидов и собираем пакет запросов для уведомления
    const batchCommandsNotifyAboutUnCallingManager = new Map<
      number,
      B24BatchCommands
    >();
    batchIndex = 0;
    leadsNeedNotify.forEach((leadId) => {
      let cmds = batchCommandsNotifyAboutUnCallingManager.get(batchIndex) ?? {};

      if (Object.keys(cmds).length === 50) {
        batchCommandsNotifyAboutUnCallingManager.set(batchIndex, cmds);
        batchIndex++;
        cmds = batchCommandsNotifyAboutUnCallingManager.get(batchIndex) ?? {};
      }

      cmds[`send_message-${leadId}`] = {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixService.getConstant('BOT_ID'),
          DIALOG_ID: 'chat57186', // Предложения РК/SEO новым клиентам
          MESSAGE:
            '[b]Менеджер не звонил в течение 5 дней.[/b][br][br]' +
            this.bitrixService.generateLeadUrl(leadId),
        },
      };

      batchCommandsNotifyAboutUnCallingManager.set(batchIndex, cmds);
      leadsFromBitrix.delete(leadId); // Удаляем с изначального массива лидов
      notifiedLeads.add(leadId); // Добавляем в массив для результата
    });

    // Обработка ошибок
    // Выполняем запрос
    try {
      Promise.all([
        ...Array.from(batchCommandsNotifyAboutUnCallingManager.values()).map(
          (cmds) => this.bitrixService.callBatch(cmds),
        ),
        // Удаляем обработанные лиды и не активные лиды
        this.removeLeadsObserveManagerCalling([
          ...notifiedLeads,
          ...deletedLeads,
        ]),
      ]);
    } catch (err) {
      return {
        status: false,
        message: `Exception error on notify about fineded uncalling leads. ${err.message}`,
        data: {
          notifiedLeads: [...notifiedLeads],
          missingLeads: [...missingLeads],
          updatedLeads: [...updatedLeads],
          deletedLeads: [...deletedLeads],
        },
        total: {
          notifiedLeads: notifiedLeads.size,
          missingLeads: missingLeads.size,
          updatedLeads: updatedLeads.size,
          deletedLeads: deletedLeads.size,
          uniqueLeads: uniqueCalls.size,
        },
      };
    }

    return {
      status: true,
      message: 'Leads notified successfully.',
      data: {
        notifiedLeads: [...notifiedLeads],
        missingLeads: [...missingLeads],
        updatedLeads: [...updatedLeads],
        deletedLeads: [...deletedLeads],
      },
      total: {
        notifiedLeads: notifiedLeads.size,
        missingLeads: missingLeads.size,
        updatedLeads: updatedLeads.size,
        deletedLeads: deletedLeads.size,
        uniqueLeads: uniqueCalls.size,
      },
    };
  }

  /**
   * Helper which get calls at last 2 weeks from telphin and save in cache
   *
   * ---
   *
   * Хелпер, который получает список звонков за последние две недели и сохраняет кеш
   */
  public async handleObserveManagerCallingGetCallsAtLast2WeeksHelper(): Promise<boolean> {
    try {
      const callsFromCache = await this.redisService.get<TelphinCallOptions[]>(
        REDIS_KEYS.BITRIX_DATA_LEADS_OBSERVE_MANAGER_CALLING_TELPHIN_CALLS_TWO_WEEKS,
      );

      if (callsFromCache) throw new ConflictException('Calls was loaded');

      const dateNow = dayjs();

      // Получаем список групп где в названии есть sale
      // Получаем список внутренних номеров
      const [extensionGroupList, extensionList] = await Promise.all([
        this.telphinService.getFilteredExtensionsByGroupField('name', 'sale'),
        this.telphinService.getClientExtensionList(),
      ]);

      // Выбираем только ID
      const extensionGroupIds = extensionGroupList.map(
        (extensionGroup) => extensionGroup.id,
      );

      // Фильтруем список внутренних номеров по ID группы
      const extensionIds = extensionList.reduce<number[]>((acc, extension) => {
        if (!extensionGroupIds.includes(extension.extension_group_id))
          return acc;
        acc.push(extension.id);
        return acc;
      }, []);

      const calls = await this.telphinService.getCallList({
        start_datetime: dateNow
          .subtract(14, 'd')
          .format('YYYY-MM-DD [00:00:00]'),
        end_datetime: dateNow.format('YYYY-MM-DD HH:mm:ss'),
        extension_id: extensionIds,
      });

      if (!calls) return false;

      // Сохраняем результат в редис
      await this.redisService.set<TelphinCallOptions[]>(
        REDIS_KEYS.BITRIX_DATA_LEADS_OBSERVE_MANAGER_CALLING_TELPHIN_CALLS_TWO_WEEKS,
        calls.calls,
      );

      return true;
    } catch (error) {
      this.logger.error({
        handler:
          this.handleObserveManagerCallingGetCallsAtLast2WeeksHelper.name,
        error,
      });
      throw error;
    }
  }

  /**
   * Check manager calling. If calling not exists at 5 days ago - alert
   *
   * ---
   *
   * Проверка звонков менеджеров. Если менеджер не звонил в течение 5 дней - сообщение руководителю
   */
  public async handleObserveManagerCallingAtLastFiveDays() {
    try {
      // Получаем звонки из Telphin за последние 2 недели
      const telphinCallsResponse =
        (await this.redisService.get<TelphinCallOptions[]>(
          REDIS_KEYS.BITRIX_DATA_LEADS_OBSERVE_MANAGER_CALLING_TELPHIN_CALLS_TWO_WEEKS,
        )) ?? [];

      if (telphinCallsResponse.length === 0)
        throw new UnprocessableEntityException('Звонков не найдено');

      // Получаем список групп где в названии есть sale
      // Получаем список внутренних номеров
      const [extensionGroupList, extensionList] = await Promise.all([
        this.telphinService.getFilteredExtensionsByGroupField('name', 'sale'),
        this.telphinService.getClientExtensionList(),
      ]);
      const dateNow = dayjs();

      // Выбираем только ID
      const extensionGroupIds = extensionGroupList.map(
        (extensionGroup) => extensionGroup.id,
      );

      // Получаем список внутренних номеров по ID группы
      const extensionPhoneList = extensionList.reduce<string[]>(
        (acc, extension) => {
          if (!extensionGroupIds.includes(extension.extension_group_id))
            return acc;
          acc.push(extension.ani);
          return acc;
        },
        [],
      );

      const managerCallsMap = new Map<string, string>();

      // Проходимся по результату и собираем мапу, где
      // ключ - ID внутреннего номера менеджера
      // значение - Объект из номеров и даты звонков, где
      // ключ - номер телефона
      // значение - список дат звонков
      telphinCallsResponse.forEach((call) => {
        let phone: string;

        if (!extensionPhoneList.includes(call.to_username)) {
          phone = call.to_username;
        } else if (call.bridged_username) {
          phone = call.bridged_username;
        } else if (!extensionPhoneList.includes(call.to_username)) {
          phone = call.to_username;
        } else if (!extensionPhoneList.includes(call.from_screen_name)) {
          phone = call.from_screen_name;
        } else {
          phone = '';
        }

        if (!phone || phone.includes('*')) return;

        phone = phone.replace('+', '');

        const callInitAt = call.init_time_gmt;

        // Если нет такого номера добавляем
        // Если текущая дата позднее той, которая в объекте: перезаписываем
        if (
          !managerCallsMap.has(phone) ||
          dayjs(callInitAt).isAfter(managerCallsMap.get(phone))
        ) {
          managerCallsMap.set(phone, callInitAt);
        }
      });

      // Проходим по мапе с номерами и убираем номера, где дата больше -7 дней с текущего момента
      managerCallsMap.forEach((callDate, phone) => {
        if (dayjs(callDate).isBefore(dateNow.subtract(8, 'd'))) return;

        // Удаляем номера, у которых был недавно звонок
        managerCallsMap.delete(phone);
      });

      if (managerCallsMap.size === 0)
        throw new UnprocessableEntityException(
          'Не удалось сформировать звонки',
        );

      let batchErrors: string[];
      const batchCommandsMap = new Map<number, B24BatchCommands>();
      let batchCommandsMapIndex = 0;

      // Проходим по номерам, у которых не было звонков больше 5 дней и составляем запрос на поиск дубликатов в активных стадиях
      managerCallsMap.forEach((callDate, phone) => {
        let commands = batchCommandsMap.get(batchCommandsMapIndex) ?? {};

        if (Object.keys(commands).length === 50) {
          batchCommandsMapIndex++;
          commands = batchCommandsMap.get(batchCommandsMapIndex) ?? {};
        }

        commands[`find_duplicate=${phone}`] = {
          method: 'crm.duplicate.findbycomm',
          params: {
            type: 'PHONE',
            values: [phone],
            entity_type: 'LEAD',
          },
        };

        if (Object.keys(commands).length === 50) {
          batchCommandsMap.set(batchCommandsMapIndex, commands);
          batchCommandsMapIndex++;
          commands = batchCommandsMap.get(batchCommandsMapIndex) ?? {};
        }

        commands[`get_lead=${phone}`] = {
          method: 'crm.lead.list',
          params: {
            filter: {
              ID: `$result[find_duplicate=${phone}][LEAD][0]`,
              '@STATUS_ID': [...B24LeadNewStages, ...B24LeadActiveStages],
            },
          },
        };

        batchCommandsMap.set(batchCommandsMapIndex, commands);
      });

      const batchResponses = await Promise.all<
        Promise<
          B24BatchResponseMap<Record<string, B24Lead[] | { LEAD: number[] }>>
        >[]
      >(
        Array.from(batchCommandsMap.values()).map((commands) =>
          this.bitrixService.callBatch(commands),
        ),
      );

      // Проверяем есть ли ошибки в ответе от битрикс
      batchErrors = batchResponses.reduce<string[]>(
        (acc, { result: { result_error } }) => {
          const errors = Object.values(result_error);
          if (errors.length === 0) return acc;
          errors.forEach((err) => acc.push(err.error));
          return acc;
        },
        [],
      );

      if (batchErrors.length !== 0)
        throw new UnprocessableEntityException(batchResponses);

      const filteredLeads = new Set<string>();

      // Отчищаем предыдущие пакеты запросов
      batchCommandsMap.clear();
      batchCommandsMapIndex = 0;

      // Проходим по результатам и формируем запросы на получение пользователей
      batchResponses.forEach(({ result: { result: response } }) => {
        Object.entries(response).forEach(([command, response]) => {
          const [commandName] = command.split('=');

          if (commandName !== 'get_lead') return;

          if (
            !Array.isArray(response) ||
            response.length === 0 ||
            response.length > 1
          )
            return;

          const [lead] = response;

          // На всякий случай проверяем, если лид не в активных стадиях
          if (
            ![...B24LeadActiveStages, ...B24LeadNewStages].includes(
              lead.STATUS_ID,
            ) ||
            filteredLeads.has(lead.ID)
          )
            return;

          const { ID: leadId, ASSIGNED_BY_ID: leadAssignedId } = lead;

          let commands = batchCommandsMap.get(batchCommandsMapIndex) ?? {};

          if (Object.keys(commands).length === 50) {
            batchCommandsMapIndex++;
            commands = batchCommandsMap.get(batchCommandsMapIndex) ?? {};
          }

          // Составляем запрос для получения полей пользователя
          // чтобы получить ID подразделения
          commands[`get_assigned_user=${leadId}=${leadAssignedId}`] = {
            method: 'user.get',
            params: {
              filter: {
                ID: leadAssignedId,
              },
            },
          };

          if (Object.keys(commands).length === 50) {
            batchCommandsMap.set(batchCommandsMapIndex, commands);
            batchCommandsMapIndex++;
            commands = batchCommandsMap.get(batchCommandsMapIndex) ?? {};
          }

          commands[`get_assigned_user_department=${leadId}=${leadAssignedId}`] =
            {
              method: 'department.get',
              params: {
                ID: `$result[get_assigned_user=${leadId}=${leadAssignedId}][0][UF_DEPARTMENT][0]`,
              },
            };

          // Добавляем запрос в общему числу запросов
          batchCommandsMap.set(batchCommandsMapIndex, commands);

          filteredLeads.add(lead.ID);
        });
      });

      // Отправляем запрос на полуение пользователей
      const responsesGetLeadInfo = await Promise.all(
        [...batchCommandsMap.values()].map((commands) =>
          this.bitrixService.callBatch<
            Record<string, B24User[] | B24Department[]>
          >(commands),
        ),
      );

      // Проверяем на ошибки
      batchErrors = responsesGetLeadInfo.reduce<string[]>(
        (acc, { result: { result_error } }) => {
          const errors = Object.values(result_error);
          if (errors.length === 0) return acc;
          errors.forEach((err) => acc.push(err.error));
          return acc;
        },
        [],
      );

      if (batchErrors.length !== 0)
        throw new UnprocessableEntityException(batchErrors);

      // Последняя мапа, где ключ - id руководителя в битрикс, значение: список лидов
      const headLeadsMap = new Map<string, string[]>();

      // Проходим по результату и формируем мапу
      responsesGetLeadInfo.forEach(({ result: { result: response } }) => {
        Object.entries(response).forEach(([command, res]) => {
          const [commandName, leadId] = command.split('=');

          // Так мы убираем запросы на получение пользователей, пустые ответы и говорим TS, что в res у нас лежит B24Department[]
          if (
            commandName !== 'get_assigned_user_department' ||
            res.length === 0 ||
            'ACTIVE' in res[0]
          )
            return;

          const [{ UF_HEAD: headUserId }] = res;

          const leads = headLeadsMap.get(headUserId) ?? [];
          headLeadsMap.set(headUserId, [...leads, leadId]);
        });
      });

      // Отчищаем предыдущие пакеты запросов
      batchCommandsMap.clear();
      batchCommandsMapIndex = 0;

      // Проходим по мапе с руководителями и лидами и формируем батч запросы для отправки уведомлений
      Array.from(headLeadsMap.entries()).forEach(([headId, leadIds]) => {
        if (leadIds.length === 0) return;

        let commands = batchCommandsMap.get(batchCommandsMapIndex) ?? {};

        if (Object.keys(commands).length === 50) {
          batchCommandsMapIndex++;
          commands = batchCommandsMap.get(batchCommandsMapIndex) ?? {};
        }

        commands[`notify_head=${headId}`] = {
          method: 'imbot.message.add',
          params: {
            BOT_ID: this.bitrixService.getConstant('BOT_ID'),
            DIALOG_ID: this.bitrixService.getConstant('SALE').frodSaleChatId,
            MESSAGE:
              `[user=${headId}][/user][br]` +
              (leadIds.length > 1
                ? 'Найдены лиды, по которым '
                : 'Найден лид, по которому ') +
              'менеджер не звонил за последние 5 дней[br][br]' +
              leadIds
                .map((leadId) => this.bitrixService.generateLeadUrl(leadId))
                .join('[br]'),
          },
        };

        batchCommandsMap.set(batchCommandsMapIndex, commands);
      });

      Promise.all(
        Array.from(batchCommandsMap.values()).map((commands) =>
          this.bitrixService.callBatch(commands),
        ),
      ).then((response) =>
        this.logger.debug({
          handler: this.handleObserveManagerCallingAtLastFiveDays.name,
          response,
        }),
      );

      return {
        status: true,
        message:
          "Successfully handle leads which calls wasn't found at last 5 days",
      };
    } catch (error) {
      this.logger.error({
        handler: this.handleObserveManagerCallingAtLastFiveDays.name,
        error,
      });

      throw error;
    }
  }

  /**
   * Update or create new leads in DB
   *
   * ---
   *
   * Обновляет или создает новые записи лидов в БД
   *
   * @param leads
   * @private
   */
  private async updateOrAddOnDBLeadsObserveManagerCalling(
    leads: LeadObserveManagerCallingLeadBitrixItem[],
  ) {
    return this.bitrixManagerCallingRepository.addOrUpdateCalls(
      leads.reduce<LeadObserveManagerCallingCreationalAttributes[]>(
        (acc, { id, phone, dateCalling }) => {
          acc.push({
            leadId: id,
            dateCalling: dateCalling,
            phone: phone,
          });
          return acc;
        },
        [],
      ),
      {
        updateOnDuplicate: ['dateCalling'],
      },
    );
  }

  private async removeLeadsObserveManagerCalling(leadIds: string[]) {
    return this.bitrixManagerCallingRepository.removeCallItems<string>(
      'leadId',
      leadIds,
    );
  }

  /**
   * Observe leads in stage **Новый в работе** and check exists calls
   *
   * ---
   *
   * Отслеживает лиды в стадии **Новый в работе** и проверяет звонок
   */
  public async handleObserveActiveLeadsCalls() {
    try {
      // Текущая дата и время
      const dateNow = dayjs();

      // Проверяем если понедельник, то нужно выбрать с пт, если нет, то выбираем за вчерашний день
      const dateFilterStart =
        dateNow.get('d') == 1
          ? dayjs().subtract(3, 'day')
          : dayjs().subtract(1, 'day');

      // Текущее время -1 час
      const dateNowSubtract1Hour = dateNow.subtract(1, 'hour');

      // Лимит запросов битрикс
      const limit = 50;

      // Фильтруем лиды по статусу Новый в работе и дата перехода в стадию со вчера 17:00
      const filterGetLeadList = {
        STATUS_ID: B24LeadActiveStages[0], // Новый в работе
        // Если текущий час 9 утра, то мы выбираем со вчерашнего дня иначе с сегодняшнего дня
        '>=MOVED_TIME':
          dateNow.get('h') <= 9
            ? dateFilterStart.format('YYYY-MM-DD [17:00:00]')
            : dateNow.format('YYYY-MM-DD [00:00:00]'),
        // До текущего времени -1 час
        '<=MOVED_TIME': dateNowSubtract1Hour.format('YYYY-MM-DD HH:mm:ss'),
      };
      const selectGetLeadList = [
        'ID',
        'TITLE',
        'MOVED_TIME',
        'PHONE',
        'ASSIGNED_BY_ID',
      ];
      const [response, calls] = await Promise.all([
        // Отправляем запрос на получения лидов и их общего кол-ва
        this.bitrixService.callMethod<B24ListParams<B24Lead>, B24Lead[]>(
          'crm.lead.list',
          {
            filter: filterGetLeadList,
            select: selectGetLeadList,
          },
        ),

        // Получение списка звонков с Telphin
        this.telphinService.getCallList({
          start_datetime:
            dateNow.get('h') <= 9
              ? dateFilterStart.format('YYYY-MM-DD [14:00:00]')
              : dateNow.format('YYYY-MM-DD [00:00:00]'),
          end_datetime: dateNow.format('YYYY-MM-DD HH:mm:ss'),
        }),
      ]);

      if (!response)
        return {
          status: false,
          message: 'Invalid get leads',
        };

      if (!calls)
        return {
          status: false,
          message: 'Invalid get calls',
        };

      const { result, total: totalLeads } = response;
      const leads: B24Lead[] = [];

      // Проверяем общее кол-во записей, если оно больше 50(лимит битрикс)
      // надо сделать n батч запросов для получения всех лидов
      if (totalLeads && totalLeads > limit) {
        // Для начала формируем запросы
        // Общее кол-во запросов
        const totalRequests = Math.ceil(totalLeads / limit);
        // Место, куда будем записывать запросы
        const commandsMap = new Map<number, B24BatchCommands>();
        // Итератор
        let index = 1;
        let mapIndex = 0;

        while (index <= totalRequests) {
          let commands = commandsMap.get(mapIndex) ?? {};

          if (Object.keys(commands).length === 50) {
            mapIndex++;
            commands = commandsMap.get(mapIndex) ?? {};
          }

          commands[`get_lead=${index}`] = {
            method: 'crm.lead.list',
            params: {
              filter: filterGetLeadList,
              select: selectGetLeadList,
              start: (index - 1) * 50,
            },
          };

          commandsMap.set(mapIndex, commands);

          index++;
        }

        // Проходим по всем запросам и выполняем их
        const responses = await Promise.all(
          Object.values(commandsMap).map((commands) =>
            this.bitrixService.callBatch(commands),
          ),
        );

        // Проверяем в каждом результате поле result_error
        const hasErrors = responses.reduce<string[]>((acc, response) => {
          const errors = Object.keys(response.result.result_error);
          if (errors.length === 0) return acc;

          errors.forEach((err) => acc.push(err));

          return acc;
        }, []);

        // Если в итоге массив ошибок не пустой: возвращаем ошибку
        if (hasErrors.length > 0) throw new BadRequestException(hasErrors);

        // проходим по результату и добавляем лиды к общему числу лидов
        responses.forEach((res) => {
          leads.push(...Object.values(res.result.result));
        });
      } else {
        result && leads.push(...result);
      }

      const leadsNeedNotifyAboutCall = new Map<
        string,
        BitrixLeadsObserveActiveCallsLeadsNotFoundOptions
      >();

      // Проходимся по лидам и пытаемся найти в массиве calls звонок
      leads.forEach(
        ({
          ID: leadId,
          PHONE: leadPhones,
          ASSIGNED_BY_ID: leadAssignedById,
          MOVED_TIME: leadMovedTime,
        }) => {
          const phones =
            leadPhones.length > 0
              ? leadPhones.map((p) => p.VALUE.replaceAll(/[- ()]/gi, ''))
              : [];

          if (phones.length === 0) return;

          // Пытаемся найти звонок по номеру телефона
          // Так как изначально список звонков отсортирован ищем первое вхождение
          const findCalls = calls.calls.reduce<string[]>((acc, call) => {
            phones.forEach((phone) => {
              if (!Object.values(call).includes(phone)) return;

              acc.push(call.init_time_gmt);
            });

            return acc;
          }, []);

          // Если не нашли звонок
          if (findCalls.length === 0) {
            leadsNeedNotifyAboutCall.set(leadId, {
              leadId: leadId,
              assignedId: leadAssignedById,
              movedAt: leadMovedTime,
              lastCallAt: '',
              assignedHeadId: '',
            });
            return;
          }

          const callInitAt = dayjs(findCalls[0]).add(3, 'h');
          const leadMovedAt = dayjs(leadMovedTime);

          // Если звонок был в течение часа с момента перехода на стадию
          // Или после перехода был звонок: выходим
          if (
            callInitAt.isBetween(
              // дата перехода на стадию -15 минут
              leadMovedAt.subtract(15, 'm'),
              // дата перехода на стадию +1 час
              leadMovedAt.add(1, 'h'),
              'm',
            ) ||
            callInitAt.isSameOrAfter(leadMovedAt.add(1, 'h'), 'h')
          )
            return;

          // Если звонка не было
          leadsNeedNotifyAboutCall.set(leadId, {
            leadId: leadId,
            assignedId: leadAssignedById,
            movedAt: leadMovedTime,
            lastCallAt: dayjs(findCalls[0]).local().format(),
            assignedHeadId: '',
          });
        },
      );

      // Если нет лидов, по которым не было звонков в течение часа
      if (leadsNeedNotifyAboutCall.size === 0)
        return {
          status: true,
          message: 'Not found leads',
        };

      let index = 0;
      const batchCommandsGetAssignedHeads = new Map<number, B24BatchCommands>();

      // Проходимся по лидам и составляем батч запросы для получения Руководителя менеджера
      leadsNeedNotifyAboutCall.forEach(({ leadId, assignedId }) => {
        let commands = batchCommandsGetAssignedHeads.get(index) ?? {};

        if (Object.keys(commands).length === 50) {
          index++;
          commands = batchCommandsGetAssignedHeads.get(index) ?? {};
        }

        // Формируем запрос на получениие пользователя
        commands[`get_user=${leadId}`] = {
          method: 'user.get',
          params: {
            filter: {
              ID: assignedId,
            },
          },
        };

        if (Object.keys(commands).length === 50) {
          batchCommandsGetAssignedHeads.set(index, commands);
          index++;
          commands = batchCommandsGetAssignedHeads.get(index) ?? {};
        }

        // Формируем запрос на получения подразделение пользователя
        commands[`get_user_department=${leadId}`] = {
          method: 'department.get',
          params: {
            ID: `$result[get_user=${leadId}][0][UF_DEPARTMENT][0]`,
          },
        };

        batchCommandsGetAssignedHeads.set(index, commands);
      });

      // Выполняем запросы на получение руководителей
      const batchResponsesGetAssignedHead = await Promise.all(
        Array.from(batchCommandsGetAssignedHeads.values()).map((commands) =>
          this.bitrixService.callBatch(commands),
        ),
      );

      // Проверяем на ошибки в каждом запросе
      const errorsGetAssignedHead = batchResponsesGetAssignedHead.reduce<
        string[]
      >((acc, response) => {
        const errors = Object.keys(response.result.result_error);
        if (errors.length === 0) return acc;
        acc.push(...errors);
        return acc;
      }, []);

      if (errorsGetAssignedHead.length > 0)
        throw new BadRequestException(errorsGetAssignedHead);

      const headLeads: Record<string, string[]> = {};

      // Проходим по результатам и получаем ID руководителя из запросов get_user_department
      batchResponsesGetAssignedHead.forEach(
        ({ result: { result: response } }) => {
          Object.entries(response).forEach(([commandName, commandResponse]) => {
            const [command, leadId] = commandName.split('=');

            if (command !== 'get_user_department') return;

            const leadFields = leadsNeedNotifyAboutCall.get(leadId);

            if (!leadFields) return;

            const assignedHeadId = commandResponse[0].UF_HEAD;

            if (assignedHeadId in headLeads) {
              headLeads[assignedHeadId].push(leadId);
            } else {
              headLeads[assignedHeadId] = [leadId];
            }
          });
        },
      );

      // Объект для итоговых запросов
      const batchCommandsNotifyHeads: B24BatchCommands = {};
      // Словарь, где ключ - id лида, значение - счетчик уведомлений
      const leadsNotified =
        (await this.redisService.get<Record<string, number>>(
          REDIS_KEYS.BITRIX_DATA_OBSERVE_ACTIVE_LEADS_CALL_COUNTER,
        )) ?? {};

      index = 0;
      // Проходим по словарю и формируем запросы на отправку уведомлений
      await Promise.all(
        Object.entries(headLeads).map(async ([assignedHeadId, leads]) => {
          // Если нет лидов: выходим
          if (leads.length === 0) return;

          await Promise.all(
            leads.map(async (leadId) => {
              const leadFromCache = await this.redisService.get<string>(
                REDIS_KEYS.BITRIX_DATA_OBSERVE_ACTIVE_LEADS_CALL + leadId,
              );

              // Если лид есть в кеше выходим
              if (leadFromCache) return;

              // Счетчик уведомлений за день по одному лиду
              const leadNotifyCounter =
                leadId in leadsNotified ? leadsNotified[leadId] : 0;
              // Начинаем формировать сообщение для руководителя
              let notifyMessage = `${leads.length > 1 ? 'Найдены лиды, по которым' : 'Найден лид, по которому'} менеджер не звонил клиенту за последний час с момента перехода на стадию [b]Новый в работе[/b][br][br]`;

              notifyMessage +=
                this.bitrixService.generateLeadUrl(leadId) +
                (leadNotifyCounter > 1
                  ? ` [b]${getNoun(leadNotifyCounter, ['раз', 'раза', 'раз'])}[/b]`
                  : '') +
                '[br]';

              // Собираем запрос
              batchCommandsNotifyHeads[
                `notify_about_expires_call=${assignedHeadId}`
              ] = {
                method: 'imbot.message.add',
                params: {
                  BOT_ID: this.bitrixService.getConstant('BOT_ID'),
                  DIALOG_ID:
                    this.bitrixService.getConstant('SALE').frodSaleChatId,
                  MESSAGE:
                    `[user=${assignedHeadId || this.bitrixService.getConstant('ZLATA_ZIMINA_BITRIX_ID')}][/user][br]` +
                    notifyMessage,
                },
              };

              leadsNotified[leadId] = leadNotifyCounter + 1;

              // Сохраняем в кеш лид
              this.redisService.set<string>(
                REDIS_KEYS.BITRIX_DATA_OBSERVE_ACTIVE_LEADS_CALL + leadId,
                leadId,
                28800, // 8 hours
              );
            }),
          );
        }),
      );

      // Сохраняем счетчик уведомлений лидов
      this.redisService.set<Record<string, number>>(
        REDIS_KEYS.BITRIX_DATA_OBSERVE_ACTIVE_LEADS_CALL_COUNTER,
        leadsNotified,
        28800, // 8 hours
      );

      this.bitrixService.callBatch(batchCommandsNotifyHeads).then((res) =>
        this.logger.debug({
          request: batchCommandsNotifyHeads,
          response: res,
        }),
      );

      return {
        status: true,
        message: 'Successfully handled leads',
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: false,
        message: 'Execution error',
      };
    }
  }

  /**
   * Handle data from sync telphin calls
   *
   * ---
   *
   * Обрабатывает данные с выгрузки телфина
   */
  public async handleSyncCallsToLeads(fields: BitrixSyncCalls) {
    const { only_new: onlyNew, calls } = fields;

    let batchErrors: string[];
    let batchCommandsIndex = 0;
    const batchCommandsMap = new Map<number, B24BatchCommands>();

    // Проходим по данным и составляем запрос на получение дубликатов по номеру телефона
    calls.forEach(({ phone, avito_number, avito_name }) => {
      let commands = batchCommandsMap.get(batchCommandsIndex) ?? {};

      if (Object.keys(commands).length === 50) {
        batchCommandsIndex++;
        commands = batchCommandsMap.get(batchCommandsIndex) ?? {};
      }

      commands[`get_duplicate=${phone}=${avito_number}=${avito_name}`] = {
        method: 'crm.duplicate.findbycomm',
        params: {
          type: 'PHONE',
          entity_type: 'lead',
          values: [phone],
        },
      };

      batchCommandsMap.set(batchCommandsIndex, commands);
    });

    const batchResponses = await Promise.all(
      Array.from(batchCommandsMap.values()).map((commands) =>
        this.bitrixService.callBatch(commands),
      ),
    );

    batchErrors = batchResponses.reduce<string[]>(
      (acc, { result: { result_error: errorResponses } }) => {
        const errors = Object.values(errorResponses);

        if (errors.length === 0) return acc;

        acc.push(...errors.map((err) => err.error));

        return acc;
      },
      [],
    );

    if (batchErrors.length > 0)
      throw new UnprocessableEntityException(batchErrors);

    return batchResponses;
  }

  /**
   * Distribute new leads on managers
   *
   * ---
   *
   * Распределяет новые лиды на менеджеров
   * @param userId {string} - ID пользователя битрикс, с которого распределять лиды
   */
  public async handleDistributeNewLeads(userId: string) {
    if (!userId) throw new BadRequestException('User id is required');

    const getActiveLeadsFilter = {
      '@stageId': B24LeadNewStages,
      assignedById: '$result[get_user][0][ID]',
    };
    const getActiveLeadsSelect = ['ID'];

    const [
      {
        result: {
          result: {
            get_user: [user],
            get_active_leads: { items: activeLeads },
          },
        },
      },
      saleList,
    ] = await Promise.all([
      this.bitrixService.callBatch<{
        get_user: B24User[];
        get_active_leads: { items: B24Lead[] };
      }>({
        // Пытаемся найти пользователя
        get_user: {
          method: 'user.get',
          params: {
            filter: {
              ID: userId,
            },
          },
        },

        // Получаем все лиды с пользователя
        get_active_leads: {
          method: 'crm.item.list',
          params: {
            entityTypeId: 1, // LEAD
            filter: getActiveLeadsFilter,
            select: getActiveLeadsSelect,
            start: 0,
          },
        },
      }),
      this.wikiService.getWorkingSales(true),
    ]);

    if (!user) throw new NotFoundException('User not found');

    if (activeLeads.length === 0)
      throw new UnprocessableEntityException('Leads not found');

    let leads: Map<string, B24LeadActivities> = new Map<
      string,
      B24LeadActivities
    >();
    let commands: B24BatchCommands = {};

    if (activeLeads.length > 50) {
      const queries = Math.ceil(activeLeads.length / BITRIX_LIMIT_REQUESTS); // Кол-во запросов для получения всех лидов
      let page = 0;

      while (page < queries) {
        const bitrixPage = (page - 1) * BITRIX_LIMIT_REQUESTS;
        commands[`get_active_leads=${bitrixPage}`] = {
          method: 'crm.item.list',
          params: {
            entityTypeId: 1, // LEAD
            filter: getActiveLeadsSelect,
            select: getActiveLeadsSelect,
            start: bitrixPage,
          },
        };
        ++page;
      }

      const responses =
        await this.bitrixService.callBatches<
          Record<string, { items: B24Lead[] }>
        >(commands);

      commands = {};

      // Проходим по результату получения лидов и собираем массив лидов и споском звонков
      Object.values(responses).forEach(({ items: result }) => {
        result.forEach((item) => {
          leads.set(item.id.toString(), {
            ...item,
            activities: [],
          });
        });
      });
    } else {
      activeLeads.forEach((activeLead) => {
        leads.set(activeLead.id.toString(), { ...activeLead, activities: [] });
      });
    }

    if (leads.size === 0)
      throw new UnprocessableEntityException('Nothing to distribute');

    commands = {};

    // Собираем запросы для получения звонков
    leads.forEach((item) => {
      commands[`get_lead_activities=${item.id}`] = {
        method: 'crm.activity.list',
        params: {
          filter: {
            OWNER_ID: item.id,
            OWNER_TYPE_ID: 1, // LEAD
            PROVIDER_TYPE_ID: 'CALL',
            COMPLETED: 'N',
          },
          select: [
            'ID',
            'RESPONSIBLE_ID',
            'TYPE_ID',
            'OWNER_ID',
            'OWNER_TYPE_ID',
          ],
          order: ['CREATED', 'ASC'],
          start: 0,
        },
      };
    });

    // Выполняем запросы на получение списка звонков по каждому лиду
    const responsesActivities =
      await this.bitrixService.callBatches<Record<string, B24Activity[]>>(
        commands,
      );

    // Добавляем звонки к лидам
    Object.entries(responsesActivities).forEach(([command, result]) => {
      const [, leadId] = command.split('=');
      const lead = leads.get(leadId);

      if (!lead) return;

      lead.activities.push(...result);
      leads.set(leadId, lead);
    });

    commands = {};

    for (const lead of leads.values()) {
      const userId = await this.bitrixUsers.getMinWorkFlowUser(saleList);

      if (!userId) return;

      commands[`update_lead=${lead.id}`] = {
        method: 'crm.item.update',
        params: {
          entityTypeId: 1, // LEAD
          id: lead.id,
          fields: {
            assignedById: userId,
          },
        },
      };

      if (lead.activities.length === 0) return;

      lead.activities.forEach((activity) => {
        commands[`update_lead_activity=${lead.id}=${activity.ID}`] = {
          method: 'crm.activity.update',
          params: {
            id: activity.ID,
            fields: {
              RESPONSIBLE_ID: userId,
            },
          },
        };
      });
    }

    this.bitrixService
      .callBatches(commands)
      .then((res) =>
        this.logger.debug({
          handler: this.handleDistributeNewLeads.name,
          request: commands,
          response: res,
        }),
      )
      .catch((err) =>
        this.logger.error({
          handler: this.handleDistributeNewLeads.name,
          request: commands,
          response: err,
        }),
      );

    return { status: true };
  }
}
