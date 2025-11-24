import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import {
  B24DuplicateFindByComm,
  B24Lead,
  B24LeadStatus,
} from '@/modules/bitirx/modules/lead/interfaces/lead.interface';
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
  B24LeadConvertedStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitirx/modules/lead/lead.constants';
import { B24Emoji } from '@/modules/bitirx/bitrix.constants';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { ConfigService } from '@nestjs/config';
import { BitrixAvitoConstants } from '@/common/interfaces/bitrix-config.interface';
import { ImbotApproveDistributeLeadFromAvitoByAi } from '@/modules/bitirx/modules/imbot/interfaces/imbot-approve-distribute-lead-from-avito-by-ai.interface';
import { IntegrationAvitoDistributeLeadFromAvito } from '@/modules/bitirx/modules/integration/avito/interfaces/avito-distribute-lead-from-avito.interface';

@Injectable()
export class BitrixIntegrationAvitoService {
  private readonly avitoAiChatId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixMessageService: BitrixMessageService,
    private readonly bitrixLeadService: BitrixLeadService,
    private readonly bitrixUserService: BitrixUserService,
    private readonly wikiService: WikiService,
    @Inject(forwardRef(() => BitrixImBotService))
    private readonly bitrixBotService: BitrixImBotService,
  ) {
    const avitoConstants = this.configService.get<BitrixAvitoConstants>(
      'bitrixConstants.avito',
    );

    if (!avitoConstants)
      throw new Error('BITRIX AVITO MODULE: Invalid avito contants');

    const { avitoAiChatId } = avitoConstants;

    if (!avitoAiChatId)
      throw new Error('BITRIX AVITO MODULE: Invalid avito chat id');

    this.avitoAiChatId = avitoAiChatId;
  }

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

  public async distributeClientRequests(
    fields: AvitoCreateLeadDto,
  ): Promise<IntegrationAvitoDistributeLeadFromAvito> {
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
      files,
    } = fields;
    const minWorkflowUser = await this.bitrixUserService.getMinWorkflowUser(
      await this.wikiService.getWorkingSalesFromWiki(),
    );
    const handledFiles = files.reduce<[string, string][]>(
      (acc, { filename, content_base64 }) => {
        acc.push([filename, content_base64]);
        return acc;
      },
      [],
    );
    // Ищем дубликаты
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
              UF_CRM_1692711658572: {
                fileData: handledFiles,
              }, // Файлы
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

      return {
        lead_id: (
          await this.bitrixService.callBatch<
            B24BatchResponseMap<{
              create_lead: number;
            }>
          >(batchCommands)
        ).result.result.create_lead.toString(),
        status: B24LeadStatus.NEW,
      };
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

    // Добавляем комментарий если указаны дата и время
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

    // Делаем запрос на получение информации
    const { result: batchResponse } = await this.bitrixService.callBatch<
      B24BatchResponseMap<{
        get_lead: B24Lead[];
        get_assigned_lead: B24User[];
        get_assigned_user_department: B24Department[];
      }>
    >(batchCommands);

    const { get_lead: lead, get_assigned_lead: user } = batchResponse.result;

    const { STATUS_ID, ASSIGNED_BY_ID, DATE_CREATE } = lead[0];

    const leadDateCreate = new Date(DATE_CREATE);
    const now = new Date();
    let leadStatusType = B24LeadStatus.UNKNOWN;

    const batchCommandsUpdateLead: B24BatchCommands = {};
    const updateLeadFields = {
      ASSIGNED_BY_ID: ASSIGNED_BY_ID,
      UF_CRM_1653291114976: messages.join('[br][br]'),
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
      UF_CRM_1651577716: 6856, // Тип лида: пропущенный
      UF_CRM_1692711658572: {
        fileData: handledFiles,
      }, // Файлы
      STATUS_ID: '', // Стадия сделки: Новый в работе
      UF_CRM_1712667568: avito, // С какого авито обращение
      UF_CRM_1713765220416: avito_number, // Подменный номер авито
      UF_CRM_1580204442317: city, // Город
      UF_CRM_1760173920: region, // Регион
      NAME: client_name,
      UF_CRM_1598441630: service_text, // С чем обратился
      UF_CRM_1715671150: new Date(), // дата последнего обращения
    };

    switch (true) {
      // Если лид не в активных стадиях
      case B24LeadRejectStages.includes(STATUS_ID):
        updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser; // Меняем ответственного
        updateLeadFields.STATUS_ID = 'UC_JTIP45'; // Новый в работе

        // Если менеджер уволен - меняем ответственного на менее занятого
        if (!user[0].ACTIVE) updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser;
        break;

      // Если лид в новых стадиях меняем стадию на новый в работе
      case B24LeadNewStages.includes(STATUS_ID):
        updateLeadFields.STATUS_ID = 'UC_JTIP45';

        // Если менеджер уволен - меняем ответственного на менее занятого
        if (!user[0].ACTIVE) updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser;
        break;

      // Если лид в активных стадиях - уведомляем менеджера и его руководителя
      case B24LeadActiveStages.includes(STATUS_ID):
        // Если менеджер уволен - меняем ответственного на менее занятого
        if (!user[0].ACTIVE) updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser;

        if (
          updateLeadFields.ASSIGNED_BY_ID !==
          this.bitrixService.ZLATA_ZIMINA_BITRIX_ID
        ) {
          batchCommandsUpdateLead['send_message_head'] = {
            method: 'im.message.add',
            params: {
              DIALOG_ID: this.bitrixService.ZLATA_ZIMINA_BITRIX_ID,
              MESSAGE:
                '[b]TEST[/b][br][b]ПРИОРИТЕТ ПО РАБОТЕ С ЛИДОМ! КЛИЕНТ ВАШЕГО МЕНЕДЖЕРА ИЩЕТ ДАЛЬШЕ! ' +
                'ВАМ НЕОБХОДИМО ПРОКОНТРОЛИРОВАТЬ ЧТОБЫ МЕНЕДЖЕР НАБРАЛ КЛИЕНТУ В ТЕЧЕНИЕ 10 МИНУТ![/b][br][br]' +
                `Лид: ${this.bitrixService.generateLeadUrl(leadId)}` +
                `[br]C авито: ${avito}` +
                `[br]Сообщение:[br]>>${messages.join('[br]>>')}`,
            },
          };
        }

        batchCommandsUpdateLead['send_message_manager'] = {
          method: 'im.message.add',
          params: {
            DIALOG_ID: updateLeadFields.ASSIGNED_BY_ID,
            MESSAGE:
              '[b]TEST[/b][br][b]ПРИОРИТЕТ ПО РАБОТЕ С ЛИДОМ! ВАШ КЛИЕНТ ИЩЕТ ДАЛЬШЕ! ВАМ НЕОБХОДИМО НАБРАТЬ КЛИЕНТУ В ТЕЧЕНИЕ 10 МИНУТ![/b][br][br]Лид: ' +
              this.bitrixService.generateLeadUrl(leadId) +
              `[br]C авито: ${avito}[br]Сообщение:[br]>>${messages.join('[br]>>')}[br][br][b]Скрипт:[/b]` +
              '[br]Имя, вижу, что Вы писали моему коллеге, на другое Авито, продолжаете искать подрядчика?' +
              'Возможно какие-то дополнительные вопросы появились?[br]Варианты развития событий:[br]' +
              '1. Клиент просто сравнивает, тогда говорим следующее: У нас студия, работаем уже больше 9 лет и у нас много ' +
              'аккаунтов Авито и они хорошо раскручены, скорей всего еще не раз к нам попадете. Тогда с Вами связываемся как договаривались ... ' +
              'Хорошего дня!"[br]2. Клиенту дорого, ищет варианты дешевле. - повторно рассказываем о ценности нашей услуги.О перечне работ, ' +
              'которые будем производить. Повторно предоставляем Клиенту обоснование цены - если важна именно цена и если есть возможность - ' +
              'предлагаем скидку или переориентируемКлиента с индивидуальной разработки на готовый сайт.',
          },
        };
        batchCommandsUpdateLead['add_calling'] = {
          method: 'crm.activity.add',
          params: {
            fields: {
              OWNER_ID: leadId,
              OWNER_TYPE_ID: 1,
              TYPE_ID: 2,
              COMMUNICATIONS: [{ VALUE: phone }],
              SUBJECT:
                'Продолжает искать подрядчика (Звони! Клиент продолжает искать)',
              COMPLETED: 'N',
              RESPONSIBLE_ID: updateLeadFields.ASSIGNED_BY_ID,
              DIRECTION: 2,
            },
          },
        };
        break;

      // Если лид успешный или в стадии Ожидаем подписанный договор
      // отправить сообщение Злате Зиминой
      case B24LeadConvertedStages.includes(STATUS_ID):
        batchCommandsUpdateLead['send_message_converted'] = {
          method: 'im.message.add',
          params: {
            DIALOG_ID: this.bitrixService.ZLATA_ZIMINA_BITRIX_ID,
            MESSAGE:
              `[b]TEST[/b][br]${B24Emoji.SUCCESS} [b]Действующий клиент обратился через Авито. ` +
              'Необходимо посмотреть действующие сделки ' +
              'и, при необходимости, распределить лид в работу[/b][br]' +
              this.bitrixService.generateLeadUrl(leadId) +
              `С авито: ${avito}` +
              `[br]Сообщение:[br]>>${messages.join('[br]>>')}`,
          },
        };

        updateLeadFields.ASSIGNED_BY_ID = ASSIGNED_BY_ID;
        break;
    }

    batchCommandsUpdateLead['add_comment'] = {
      method: 'crm.timeline.comment.add',
      params: {
        fields: {
          ENTITY_ID: leadId,
          ENTITY_TYPE: 'lead',
          COMMENT: `Клиент обращался на ${avito}\nИмя клиента: ${client_name}\n${messages.join('\n')}`,
        },
      },
    };

    batchCommandsUpdateLead['pin_comment'] = {
      method: 'crm.timeline.item.pin',
      params: {
        id: '$result[add_comment]',
        ownerTypeId: '1',
        ownerId: leadId,
      },
    };

    batchCommandsUpdateLead['update_lead'] = {
      method: 'crm.lead.update',
      params: {
        id: leadId,
        fields: updateLeadFields,
      },
    };

    this.bitrixService.callBatch(batchCommandsUpdateLead);

    if (
      now.toDateString() !== leadDateCreate.toDateString() &&
      B24LeadRejectStages.includes(STATUS_ID)
    ) {
      leadStatusType = B24LeadStatus.NONACTIVE;
    } else if (now.toDateString() === leadDateCreate.toDateString()) {
      leadStatusType = B24LeadStatus.ACTIVE;
    } else {
      leadStatusType = B24LeadStatus.EXISTS;
    }

    return {
      lead_id: leadId.toString(),
      status: leadStatusType,
    };
  }

  /**
   * Sending message on avito chat for manager approve lead created by ai
   *
   * ---
   *
   * Отправляет сообщение в авито чат, чтобы менеджер подтвердил обработку лида созданного ИИ
   *
   * @param fields
   */
  public async distributeClientRequestByAI(fields: AvitoCreateLeadDto) {
    const message =
      '[b]AI Avito[/b][br]Нужно отправить лид в работу:[br]' +
      `С авито: ${fields.avito}[br][br]>>` +
      fields.messages.join('[br]>>');

    const keyboardParams: ImbotApproveDistributeLeadFromAvitoByAi = {
      message: this.bitrixBotService.encodeText(message),
      fields: fields,
      approved: true,
      phone: fields.phone,
    };

    this.bitrixService.callBatch({
      send_message: {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixBotService.BOT_ID,
          DIALOG_ID: this.avitoAiChatId,
          MESSAGE: message,
          KEYBOARD: [
            {
              TEXT: 'Подтвердить',
              BG_COLOR_TOKEN: 'primary',
              COMMAND: 'approveDistributeDealFromAvitoByAI',
              COMMAND_PARAMS: JSON.stringify(keyboardParams),
              DISPLAY: 'LINE',
            },
            {
              TEXT: 'Отменить',
              BG_COLOR_TOKEN: 'alert',
              COMMAND: 'approveDistributeDealFromAvitoByAI',
              COMMAND_PARAMS: JSON.stringify({
                ...keyboardParams,
                approved: false,
              }),
              DISPLAY: 'LINE',
            },
          ],
        },
      },
    });
    return true;
  }
}
