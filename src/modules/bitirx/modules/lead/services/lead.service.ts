import { BadRequestException, Injectable } from '@nestjs/common';
import { BitrixService } from '../../../bitrix.service';
import {
  B24DuplicateFindByComm,
  B24DuplicateFindByCommResponse,
  B24Lead,
  B24LeadStatus,
} from '../interfaces/lead.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  B24BatchCommands,
  B24ListParams,
} from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import {
  LeadAvitoStatus,
  LeadAvitoStatusResponse,
} from '@/modules/bitirx/modules/lead/interfaces/lead-avito-status.interface';
import {
  B24LeadActiveStages,
  B24LeadConvertedStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitirx/modules/lead/constants/lead.constants';
import { B24StageHistoryItem } from '@/modules/bitirx/interfaces/bitrix-stagehistory.interface';
import { B24LeadUpdateFields } from '@/modules/bitirx/modules/lead/interfaces/lead-update.interface';
import { LeadObserveManagerCallingDto } from '@/modules/bitirx/modules/lead/dtos/lead-observe-manager-calling.dto';
import { LeadObserveManagerCallingLeadBitrixItem } from '@/modules/bitirx/modules/lead/interfaces/lead-observe-manager-calling.interface';
import { BitrixLeadObserveManagerCallingService } from '@/modules/bitirx/modules/lead/services/lead-observe-manager-calling.service';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class BitrixLeadService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
    private readonly bitrixLeadObserveManagerCallingService: BitrixLeadObserveManagerCallingService,
  ) {}

  /**
   * Fetch lead from bitrix by ID
   *
   * ---
   *
   * Получение лида из битрикс по ID
   *
   * @param id
   */
  public async getLeadById(id: string) {
    return await this.bitrixService.callMethod<Partial<B24Lead>, B24Lead>(
      'crm.lead.get',
      {
        ID: id,
      },
    );
  }

  public async getDuplicateLeadsByPhone(phone: string, force: boolean = false) {
    if (!force) {
      const duplicatesFromCache = await this.redisService.get<number[]>(
        REDIS_KEYS.BITRIX_DATA_LEAD_DUPLICATE_BY_PHONE + phone,
      );

      if (duplicatesFromCache && duplicatesFromCache.length !== 0)
        return duplicatesFromCache;
    }

    const { result: response } = await this.bitrixService.callMethod<
      B24DuplicateFindByComm,
      B24DuplicateFindByCommResponse
    >('crm.duplicate.findbycomm', {
      type: 'PHONE',
      values: [phone],
      entity_type: 'LEAD',
    });

    const result =
      Array.isArray(response) || !response
        ? []
        : 'LEAD' in response
          ? response.LEAD
          : [];

    if (result.length !== 0) {
      this.redisService.set<number[]>(
        REDIS_KEYS.BITRIX_DATA_LEAD_DUPLICATE_BY_PHONE + phone,
        result,
        600, // 10 минут
      );
    }

    return result;
  }

  /**
   *  Crete lead in bitrix
   *
   *  ---
   *
   *  Создание лида
   * @param fields
   */
  public async createLead(fields: Partial<B24Lead>) {
    return this.bitrixService.callMethod<Partial<B24Lead>, number>(
      'crm.lead.add',
      fields,
    );
  }

  /**
   * Get lead list by special parameters
   *
   * ---
   *
   * Получить список лидов по определенным параметрам
   *
   * @param fields
   */
  public async getLeads(fields?: B24ListParams<B24Lead>) {
    return this.bitrixService.callMethod<B24ListParams<B24Lead>, B24Lead[]>(
      'crm.deal.list',
      fields,
    );
  }

  /**
   * Update lead
   *
   * ---
   *
   * Обновление лида
   *
   * @param fields
   */
  public async updateLead(fields: B24LeadUpdateFields) {
    return this.bitrixService.callMethod<B24LeadUpdateFields, boolean>(
      'crm.lead.update',
      fields,
    );
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
      '>=DATE_CREATE': `${date.toLocaleDateString()}T00:00:00`,
      '<=DATE_CREATE': `${date.toLocaleDateString()}T23:59:59`,
    };
    const filterLeadsByDateRequest = {
      '!UF_CRM_1713765220416': '',
      '>=UF_CRM_1715671150': `${date.toLocaleDateString()}T00:00:00`,
      '<=UF_CRM_1715671150': `${date.toLocaleDateString()}T23:59:59`,
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
      await this.bitrixService.callBatch<
        B24BatchResponseMap<{
          get_leads_by_date: B24Lead[];
          get_leads_by_date_request: B24Lead[];
        }>
      >({
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
              case B24LeadActiveStages.includes(statusId) &&
                dateCreate.toLocaleDateString() !== date.toLocaleDateString():
                leadStatus = B24LeadStatus.ACTIVE;
                break;

              case B24LeadRejectStages.includes(statusId) &&
                dateCreate.toLocaleDateString() !== date.toLocaleDateString():
                leadStatus = B24LeadStatus.NONACTIVE;
                break;

              case dateCreate.toLocaleDateString() ===
                date.toLocaleDateString() ||
                (B24LeadNewStages.includes(statusId) &&
                  dateCreate.toLocaleDateString() !==
                    date.toLocaleDateString()):
                leadStatus = B24LeadStatus.NEW;
                break;

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

          if (!lead) return;
          if (new Date(lead.date_cerate).toISOString() === date.toISOString())
            return;
          if (leadStageHistory.length < 2) return;

          if (!B24LeadRejectStages.includes(leadStageHistory[1].STATUS_ID))
            return;

          lead.status = B24LeadStatus.NONACTIVE;
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
  public async observeManagerCalling({ calls }: LeadObserveManagerCallingDto) {
    const batchCommandsGetLeads = new Map<number, B24BatchCommands>();
    let batchIndex = 0;
    const errors: string[] = [];

    // Собираем батч запрос для поиска лидов по номеру телефона и получения информации по лиду
    calls.forEach(({ phone }) => {
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

      cmds[`get_lead_info=${clearPhone}`] = {
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

    // return Array.from(batchCommandsGetLeads.values());
    // Выполняем запрос
    const batchResponseGetLeads = await Promise.all<
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

    const leadsFromBitrix = new Map<
      string,
      LeadObserveManagerCallingLeadBitrixItem
    >();

    batchResponseGetLeads.forEach((b24Response) => {
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
        const [commandName, phone] = command.split('=');

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
            });
            break;
        }
      });
    });

    // Если есть ошибки выводим их
    if (errors.length !== 0) throw new BadRequestException(errors);

    // Получаем лиды из базы
    const leadsFromDB =
      await this.bitrixLeadObserveManagerCallingService.getCallingList({
        where: {
          leadId: {
            [Op.in]: Array.from(leadsFromBitrix.keys()),
          },
          dateCalling: {
            [Op.eq]: Sequelize.literal("NOW() - INTERVAL '4d'"),
          },
        },
        attributes: ['id', 'phone', 'date_calling'],
      });

    // const leadNeedAddedToDB = new Map<string, LeadObserveManagerCallingLeadBitrixItem>();
    //
    // Array.from(leadsFromBitrix.values()).forEach(bxLead => {})

    return leadsFromDB;
  }
}
