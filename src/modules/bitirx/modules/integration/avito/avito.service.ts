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

@Injectable()
export class BitrixIntegrationAvitoService {
  private readonly clientRequestType: Record<string, string> = {
    '': '', // 'не выбрано',
    'разработка сайта': '1050', // '1. Разработка сайта',
    'настройка РК': '1052', // '2. Контекстная реклама',
    SEO: '1054', // '3. SEO оптимизация',
    комплекс: '4272',
  };

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
              UF_CRM_1573459036: '', // откуда
              UF_CRM_1712667568: avito, // С какого авито обращение
              UF_CRM_1713765220416: avito_number, // Подменный номер авито
              UF_CRM_1580204442317: city, // Город
              UF_CRM_1760173920: region, // Регион
              NAME: client_name,
              UF_CRM_1598441630: this.clientRequestType[service_text], // С чем обратился
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
              COMMENT: `[b]Свяжись с клиентом ${date} ${time}[/b]`,
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
    //   todo: update lead

    return {
      message: 'need update lead',
      result: result,
    };
  }
}
