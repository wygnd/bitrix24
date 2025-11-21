import { Injectable } from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import {
  B24DuplicateFindByComm,
  B24Lead,
} from '@/modules/bitirx/modules/lead/lead.interface';
import { isArray } from 'class-validator';
import { BitrixLeadService } from '@/modules/bitirx/modules/lead/lead.service';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';
import { BitrixMessageService } from '@/modules/bitirx/modules/im/im.service';
import { AvitoFindDuplicateLeadsDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito.dto';
import { AvitoChatInfo } from '@/modules/bitirx/modules/integration/avito/interfaces/avito.interface';
import { BitrixUserService } from '@/modules/bitirx/modules/user/user.service';
import { WikiService } from '@/modules/wiki/wiki.service';
import { B24User } from '@/modules/bitirx/modules/user/user.interface';
import { B24Department } from '@/modules/bitirx/modules/department/department.interface';
import {
  B24LeadActiveStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitirx/modules/lead/lead.constants';

@Injectable()
export class BitrixIntegrationAvitoService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixMessageService: BitrixMessageService,
    private readonly bitrixLeadService: BitrixLeadService,
    private readonly bitrixUserService: BitrixUserService,
    private readonly wikiService: WikiService,
  ) {}

  public async findDuplicatesLeadsBPhones(
    fields: AvitoFindDuplicateLeadsDto[],
  ) {
    const batchCommands = fields.reduce((acc, { phone, chat_id }) => {
      acc[`getDuplicateLeads_${phone}_${chat_id}`] = {
        method: 'crm.duplicate.findbycomm',
        params: {
          type: 'PHONE',
          values: [phone],
          entity_type: 'LEAD',
        },
      };

      return acc;
    }, {} as B24BatchCommands);

    const batchResponseFindDuplicates =
      await this.bitrixService.callBatch<
        B24BatchResponseMap<
          Record<string, [] | { LEAD: B24DuplicateFindByComm[] }>
        >
      >(batchCommands);

    const { result } = batchResponseFindDuplicates.result;

    return Object.entries(result).reduce((acc, [command, response]) => {
      if (isArray(response)) return acc;

      const [, phone, chatId] = command.split('_');

      acc.push({
        phone: phone,
        chat_id: chatId,
      });

      return acc;
    }, [] as AvitoChatInfo[]);
  }

  public async notifyAboutUnreadChatsOnAvito(accountNames: string[]) {
    const notifyMessage = accountNames.reduce((acc, accountName) => {
      acc += accountName + '[br]';
      return acc;
    }, '[b]Непрочитанные сообщения с Авито:[/b][br]');

    const sendMessageResult =
      await this.bitrixMessageService.sendPrivateMessage({
        DIALOG_ID: 'chat17030', // Авито
        MESSAGE: notifyMessage,
      });

    return sendMessageResult.result ?? -1;
  }

  public async distributeClientRequests(fields: AvitoCreateLeadDto) {
    const {
      phone,
      avito_number,
      avito,
      messages,
      client_name,
      region,
      city,
      service_text,
      date,
      time,
    } = fields;
    const minWorkflowUser = await this.bitrixUserService.getMinWorkflowUser(
      await this.wikiService.getWorkingSalesFromWiki(),
    );

    const result = await this.bitrixLeadService.getDuplicateLeadsByPhone(phone);

    if (result.length === 0) {
      const batchCommands: B24BatchCommands = {
        create_lead: {
          method: 'crm.lead.add',
          params: {
            fields: {
              ASSIGNED_BY_ID:
                this.bitrixService.isAvailableToDistributeOnManager()
                  ? minWorkflowUser
                  : '344',
              UF_CRM_1669804346: avito,
              UF_CRM_1653291114976: messages.join('[br][br]'),
              PHONE: [
                {
                  VALUE: phone,
                },
              ],
              UF_CRM_1651577716: 6856, // Тип лида: пропущенный
              UF_CRM_1692711658572: '', // Файлы
              STATUS_ID: 'UC_GEWKFD', // Стадия сделки: Новый в работе
              UF_CRM_1712667568: avito, // С какого авито обращение
              UF_CRM_1713765220416: avito_number, // Подменный номер авито
              UF_CRM_1580204442317: city, // Город
              UF_CRM_1760173920: region, // Регион
              NAME: client_name,
              UF_CRM_1598441630: service_text, // С чем обратился
            },
          },
        },
      };

      if (date && time) {
        batchCommands['add_comment'] = {
          method: 'crm.timeline.comment.add',
          params: {
            fields: {
              ENTITY_ID: '$result[create_lead]',
              ENTITY_TYPE: 'lead',
              COMMENT: `[b]Свяжись с клиентом ${date} в ${time}[/b]`,
            },
          },
        };

        batchCommands['pin_comment'] = {
          method: 'crm.timeline.item.pin',
          params: {
            id: '$result[add_comment]',
            ownerTypeId: '1',
            ownerId: '$result[create_lead]',
          },
        };
      }

      return (
        await this.bitrixService.callBatch<
          B24BatchResponseMap<{
            create_lead: number;
          }>
        >(batchCommands)
      ).result.result.create_lead;
    }

    const leadId = result[0];
    const batchCommands: B24BatchCommands = {
      get_lead: {
        method: 'crm.lead.list',
        params: {
          FILTER: {
            ID: leadId,
          },
          SELECT: ['ID', 'STATUS_ID', 'ASSIGNED_BY_ID', 'DATE_CREATE'],
          start: 0,
        },
      },
      get_assigned_lead: {
        method: 'user.get',
        params: {
          FILTER: {
            ID: `$result[get_lead][0][ASSIGNED_BY_ID]`,
          },
        },
      },
      get_assigned_user_department: {
        method: 'department.get',
        params: {
          ID: `$result[get_assigned_lead][0][UF_DEPARTMENT][0]`,
        },
      },
    };

    if (date && time) {
      batchCommands['add_comment'] = {
        method: 'crm.timeline.comment.add',
        params: {
          fields: {
            ENTITY_ID: leadId,
            ENTITY_TYPE: 'lead',
            COMMENT: `[b]Свяжись с клиентом ${date} в ${time}[/b]`,
          },
        },
      };

      batchCommands['pin_comment'] = {
        method: 'crm.timeline.item.pin',
        params: {
          id: '$result[add_comment]',
          ownerTypeId: '1',
          ownerId: '$result[create_lead]',
        },
      };
    }

    const { result: batchResponse } = await this.bitrixService.callBatch<
      B24BatchResponseMap<{
        get_lead: B24Lead[];
        get_assigned_lead: B24User[];
        get_assigned_user_department: B24Department[];
      }>
    >(batchCommands);

    const { get_lead: lead } = batchResponse.result;

    const batchCommandsUpdateLead: B24BatchCommands = {};
    const updateLeadFields = {
      ASSIGNED_BY_ID: lead[0].ASSIGNED_BY_ID,
      UF_CRM_1653291114976: messages.join('[br][br]'),
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
      UF_CRM_1651577716: 6856, // Тип лида: пропущенный
      UF_CRM_1692711658572: '', // Файлы
      STATUS_ID: 'UC_GEWKFD', // Стадия сделки: Новый в работе
      UF_CRM_1712667568: avito, // С какого авито обращение
      UF_CRM_1713765220416: avito_number, // Подменный номер авито
      UF_CRM_1580204442317: city, // Город
      UF_CRM_1760173920: region, // Регион
      NAME: client_name,
      UF_CRM_1598441630: service_text, // С чем обратился
      UF_CRM_1715671150: new Date(), // дата последнего обращения
    };

    // Если лид не в активных стадиях
    if (B24LeadRejectStages.includes(lead[0].STATUS_ID)) {
      updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser; // Меняем ответственного
      updateLeadFields.STATUS_ID = 'UC_GEWKFD'; // Новый в работе
    }

    // Если лид в новых стадиях меняем стадию на новый в работе
    if (B24LeadNewStages.includes(lead[0].STATUS_ID))
      updateLeadFields.STATUS_ID = 'UC_GEWKFD';

    if (B24LeadActiveStages.includes(lead[0].STATUS_ID)) {
      batchCommandsUpdateLead['send_message_manager'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: updateLeadFields.ASSIGNED_BY_ID,
          MESSAGE:
            '[b]ПРИОРИТЕТ ПО РАБОТЕ С ЛИДОМ! ВАШ КЛИЕНТ ИЩЕТ ДАЛЬШЕ! ВАМ НЕОБХОДИМО НАБРАТЬ КЛИЕНТУ В ТЕЧЕНИЕ 10 МИНУТ![/b][br][br]Лид: ' +
            +this.bitrixService.generateLeadUrl(leadId) +
            `[br]C авито: ${avito}[br]Сообщение: >>${messages.join('[br][br]>>')}[br][br][b]Скрипт:[/b]` +
            '[br]Имя, вижу, что Вы писали моему коллеге, на другое Авито, продолжаете искатьподрядчика?' +
            'Возможно какие-то дополнительные вопросы появились?[br]Варианты развития событий:[br]1. Клиент просто сравнивает, тогда говорим следующее: "У нас студия, работаем ужебольше 9 лет и у нас много аккаунтов Авито и они хорошо раскручены, скорей всего ещене раз к нампопадете. Тогда с Вами связываемся как договаривались ... Хорошего дня!"[br]2. Клиенту дорого, ищет варианты дешевле. - повторно рассказываем о ценности нашейуслуги.О перечне работ, которые будем производить. Повторно предоставляем Клиентуобоснование цены- если важна именно цена и если есть возможность - предлагаем скидкуили переориентируемКлиента с индивидуальной разработки на готовый сайт.',
        },
      };
    }

    return {
      message: 'need update lead',
      result: result,
    };
  }
}
