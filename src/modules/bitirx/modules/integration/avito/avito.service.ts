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

@Injectable()
export class BitrixIntegrationAvitoService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixMessageService: BitrixMessageService,
    private readonly bitrixLeadService: BitrixLeadService,
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

  /**
   * Function receive array of bitrix user ids get info about new leads on each manager and getting most free workflow user
   *
   * ---
   *
   * Функция принимает массив id пользователей. Получает по каждому информацию о кол-ве новых лидов и возвращает пользователя, у которого меньше новых лидов
   *
   * @param users
   */
  public async getMinWorkflowUser(users: number[]) {
    const commands = users.reduce((acc, userId) => {
      acc[`get_user-${userId}`] = {
        method: 'user.get',
        params: {
          filter: {
            ID: userId,
          },
        },
      };

      return acc;
    }, {} as B24BatchCommands);

    const { result: batchResponse } =
      await this.bitrixService.callBatch<
        B24BatchResponseMap<Record<string, B24Lead[]>>
      >(commands);

    return Object.entries(batchResponse.result_total)
      .reduce(
        (acc, [command, totalLeads]) => {
          const [_, userId] = command.split('-');
          acc.push({
            user_id: userId,
            count_leads: totalLeads,
          });
          return acc;
        },
        [] as {
          user_id: string;
          count_leads: number;
        }[],
      )
      .sort(
        (
          { count_leads: firstCountLeads },
          { count_leads: secondCountLeads },
        ) => {
          return firstCountLeads > secondCountLeads
            ? 1
            : secondCountLeads > firstCountLeads
              ? -1
              : 0;
        },
      )[0].user_id;
  }

  public async distributeClientRequests(fields: AvitoCreateLeadDto) {
    const {
      users,
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
    const minWorkflowUser = await this.getMinWorkflowUser(users);

    const result = await this.bitrixLeadService.getDuplicateLeadsByPhone(phone);

    if (result.length === 0) {
      //   todo: create lead
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
              UF_CRM_1651577716: 6856,
              // Файлы
              UF_CRM_1692711658572: '',
              // Новый в работе
              STATUS_ID: 'UC_GEWKFD',
              // fixme: ?? idk what is that field
              UF_CRM_1573459036: '',
              // С какого авито обращение
              UF_CRM_1712667568: avito,
              UF_CRM_1713765220416: avito_number,
              UF_CRM_1580204442317: city,
              UF_CRM_1760173920: region,
              NAME: client_name,
              UF_CRM_1598441630: '',
            },
          },
        },
      };

      if (date && time) {
      }

      return;
    }
    //   todo: update lead

    return {
      message: 'need update lead',
      result: result,
    };
  }
}
