import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixLeadsPort } from '@/modules/bitrix/application/ports/leads/leads.port';
import {
  B24ActionType,
  B24BatchCommands,
  B24ListParams,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import {
  B24Lead,
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
    const filterLeadsByDate = {
      '!UF_CRM_1713765220416': '',
      '>=DATE_CREATE': `${date.toLocaleDateString()}T00:00:00`, // Дата создания
      '<=DATE_CREATE': `${date.toLocaleDateString()}T23:59:59`, // Дата создания
    };
    const filterLeadsByDateRequest = {
      '!UF_CRM_1713765220416': '',
      '>=UF_CRM_1715671150': `${date.toLocaleDateString()}T00:00:00`, // Дата последнего обращения
      '<=UF_CRM_1715671150': `${date.toLocaleDateString()}T23:59:59`, // Дата последнего обращения
    };
    const selectLeadFields = [
      'ID',
      'UF_CRM_1712667568', // С какого авито обащение
      'UF_CRM_1713765220416', // Номер авито
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

    return {
      count_leads: leadsMap.size,
      leads: Array.from(leadsMap.entries()).reduce(
        (acc, [leadId, leadData]) => {
          acc[leadId] = leadData;
          return acc;
        },
        {},
      ),
    };
  }

  /**
   * Check manager calling. If calling not exists at 5 days ago - alert
   *
   * ---
   *
   * Проверка звонков менеджеров. Если менеджер не звонил в течение 5 дней - сообщение руководителю
   * @param calls
   */
  public async handleObserveManagerCalling({ calls }: LeadManagerCallingDto) {
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
}
