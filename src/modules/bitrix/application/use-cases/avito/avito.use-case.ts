import { Inject, Injectable } from '@nestjs/common';
import { AvitoFindDuplicateLeadsDto } from '@/modules/bitrix/application/dtos/avito/avito.dto';
import { ConfigService } from '@nestjs/config';
import { QueueMiddleService } from '@/modules/queue/queue-middle.service';
import { BitrixAvitoConstants } from '@/common/interfaces/bitrix-config.interface';
import {
  B24DuplicateFindByComm,
  B24Lead,
  B24LeadStatus,
} from '../../interfaces/leads/lead.interface';
import { AvitoCreateLeadDto } from '@/modules/bitrix/application/dtos/avito/avito-create-lead.dto';
import { IntegrationAvitoDistributeLeadFromAvito } from '@/modules/bitrix/application/interfaces/avito/avito-distribute-lead-from-avito.interface';
import { ImbotApproveDistributeLeadFromAvitoByAi } from '@/modules/bitrix/application/interfaces/bot/imbot-approve-distribute-lead-from-avito-by-ai.interface';
import { B24FileData } from '@/modules/bitrix/interfaces/bitrix-files.interface';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { AvitoClientRequestsType } from '@/modules/bitrix/application/constants/avito/avito.constants';
import { B24User } from '@/modules/bitrix/application/interfaces/users/user.interface';
import { B24Department } from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import {
  B24LeadActiveStages,
  B24LeadConvertedStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/application/constants/leads/lead.constants';
import { AvitoChatInfo } from '@/modules/bitrix/application/interfaces/avito/avito.interface';
import { B24Emoji, B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import type { BitrixMessagesPort } from '@/modules/bitrix/application/ports/messages/messages.port';
import type { BitrixLeadsPort } from '@/modules/bitrix/application/ports/leads/leads.port';
import type { BitrixUsersPort } from '@/modules/bitrix/application/ports/users/users.port';
import type { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import { WinstonLogger } from '@/config/winston.logger';
import { WikiService } from '@/modules/wiki/wiki.service';
import { B24Comment } from '@/modules/bitrix/application/interfaces/comments/comments.interface';

@Injectable()
export class BitrixAvitoUseCase {
  private readonly logger = new WinstonLogger(
    BitrixAvitoUseCase.name,
    'bitrix:avito'.split(':'),
  );
  private readonly avitoAiChatId: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(B24PORTS.MESSAGES.MESSAGES_DEFAULT)
    private readonly bitrixMessages: BitrixMessagesPort,
    @Inject(B24PORTS.LEADS.LEADS_DEFAULT)
    private readonly bitrixLeads: BitrixLeadsPort,
    @Inject(B24PORTS.USERS.USERS_DEFAULT)
    private readonly bitrixUsers: BitrixUsersPort,
    @Inject(B24PORTS.BOT.BOT_DEFAULT)
    private readonly bitrixBot: BitrixBotPort,
    private readonly queueMiddleService: QueueMiddleService,
    private readonly wikiService: WikiService,
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

  public async findDuplicatesLeadsByPhones(
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
        Record<string, [] | { LEAD: B24DuplicateFindByComm[] }>
      >(batchCommands);

    const { result } = batchResponseFindDuplicates.result;

    return Object.entries(result).reduce((acc, [command, response]) => {
      if (Array.isArray(response)) return acc;

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

    return this.bitrixMessages.sendPrivateMessage({
      DIALOG_ID: 'chat17030', // Авито
      MESSAGE: notifyMessage,
    });
  }

  public async handleDistributeClientRequestFromAvito(
    fields: AvitoCreateLeadDto,
  ) {
    this.logger.debug(fields);

    fields.is_ai === '1'
      ? this.distributeClientRequestFromAvitoByAI(fields)
      : this.queueMiddleService.addTaskForDistributeClientRequestFromAvito(
          fields,
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        );

    return true;
  }

  public async distributeClientRequestFromAvito(
    fields: AvitoCreateLeadDto,
  ): Promise<IntegrationAvitoDistributeLeadFromAvito> {
    const {
      phone,
      avito_number,
      avito,
      message,
      client_name,
      region,
      city,
      service_text,
      date,
      time,
      files,
      wiki_lead_id,
    } = fields;
    const users = await this.wikiService.getWorkingSales();
    const minWorkflowUser =
      this.bitrixService.isAvailableToDistributeOnManager()
        ? ((await this.bitrixUsers.getMinWorkflowUser(users)) ??
          this.bitrixService.getConstant('ZLATA_ZIMINA_BITRIX_ID'))
        : this.bitrixService.getConstant('ZLATA_ZIMINA_BITRIX_ID');

    const leadMessage = this.bitrixService.removeEmoji(message.join('\n\n'));
    const handledFiles = files.reduce<B24FileData[]>(
      (acc, { filename, content_base64 }) => {
        acc.push({ fileData: [filename, content_base64] });
        return acc;
      },
      [],
    );
    // Ищем дубликаты
    const result = await this.bitrixLeads.getDuplicateLeadsByPhone(
      phone,
      'force',
    );

    // Создаем лид если его не нашли
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
              UF_CRM_1653291114976: leadMessage, // Сообщение с авито
              PHONE: [
                {
                  VALUE: phone,
                  VALUE_TYPE: 'WORK',
                },
              ],
              UF_CRM_1651577716: 6856, // Тип лида: пропущенный
              UF_CRM_1692711658572: handledFiles, // Скрины и документы из сообщения Авито
              STATUS_ID: 'UC_GEWKFD', // Стадия сделки: Новый в работе
              UF_CRM_1712667568: avito, // С какого авито обращение
              UF_CRM_1713765220416: avito_number, // Подменный номер авито
              UF_CRM_1580204442317: city, // Город
              UF_CRM_1760173920: region, // Регион
              NAME: client_name,
              UF_CRM_1598441630: AvitoClientRequestsType[service_text], // С чем обратился
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
        wiki_lead_id: wiki_lead_id,
        lead_id: (
          await this.bitrixService.callBatch<{
            create_lead: number;
          }>(batchCommands)
        ).result.result.create_lead,
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
          SELECT: [
            'ID',
            'STATUS_ID',
            'ASSIGNED_BY_ID',
            'DATE_CREATE',
            'UF_CRM_1712667568', // С какого авито обращение
            'UF_CRM_1713765220416', // Подменный номер авито
            'UF_CRM_1653291114976', // Сообщение с авито
            'NAME',
          ],
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
      get_lead_comment_list: {
        method: 'crm.timeline.comment.list',
        params: {
          filter: {
            ENTITY_ID: leadId,
            ENTITY_TYPE: 'lead',
          },
          select: ['ID'],
          order: {
            CREATED: 'DESC',
          },
          start: 0,
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
    const { result: batchResponse } = await this.bitrixService.callBatch<{
      get_lead: B24Lead[];
      get_assigned_lead: B24User[];
      get_assigned_user_department: B24Department[];
      get_lead_comment_list: B24Comment[];
    }>(batchCommands);

    const {
      get_lead: lead,
      get_assigned_lead: user,
      get_lead_comment_list: leadComments = [],
    } = batchResponse.result;

    const {
      STATUS_ID,
      ASSIGNED_BY_ID,
      DATE_CREATE,
      UF_CRM_1712667568: leadAvito = '',
      UF_CRM_1713765220416: leadAvitoNumber = '',
      UF_CRM_1653291114976: leadComment = '',
      NAME: leadAvitoClientName = '',
    } = lead[0];

    const leadDateCreate = new Date(DATE_CREATE);
    const now = new Date();
    let leadStatusType: B24LeadStatus;

    const batchCommandsUpdateLead: B24BatchCommands = {};
    const updateLeadFields = {
      ASSIGNED_BY_ID: ASSIGNED_BY_ID,
      UF_CRM_1712667568: avito, // С какого авито обращение
      UF_CRM_1713765220416: avito_number, // Подменный номер авито
      UF_CRM_1653291114976: leadMessage, // Сообщение с авито
      UF_CRM_1651577716: 6856, // Тип лида: пропущенный
      UF_CRM_1692711658572: handledFiles, // Скрины и документы из сообщения Авито
      STATUS_ID: '', // Стадия сделки: Лид сообщение
      NAME: client_name,
      UF_CRM_1598441630: AvitoClientRequestsType[service_text], // С чем обратился
      UF_CRM_1715671150: new Date(), // дата последнего обращения
    };

    // Если есть старые комментарии надо их открепить
    if (leadComments.length > 0) {
      leadComments.forEach(({ ID: commentId }) => {
        batchCommandsUpdateLead[`unpin_comment=${commentId}`] = {
          method: 'crm.timeline.item.unpin',
          params: {
            id: commentId,
            ownerTypeId: '1',
            ownerId: leadId,
          },
        };
      });
    } else {
      // Добавляем комментарий с прошлого авито
      batchCommandsUpdateLead['add_comment_old_avito'] = {
        method: 'crm.timeline.comment.add',
        params: {
          fields: {
            ENTITY_ID: leadId,
            ENTITY_TYPE: 'lead',
            COMMENT:
              `Клиент обращался на ${leadAvito}: [${leadAvitoNumber}]\n` +
              `Имя клиента: ${leadAvitoClientName}\n\n` +
              leadComment,
          },
        },
      };
    }

    switch (true) {
      // Если лид не в активных стадиях
      case B24LeadRejectStages.includes(STATUS_ID):
        updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser; // Меняем ответственного
        updateLeadFields.STATUS_ID = 'UC_GEWKFD'; // Лид сообщение

        // Если менеджер уволен - меняем ответственного на менее занятого
        if (!user[0].ACTIVE) updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser;
        break;

      // Если лид в новых стадиях меняем стадию на новый в работе
      case B24LeadNewStages.includes(STATUS_ID):
        updateLeadFields.STATUS_ID = 'UC_GEWKFD';

        // Если менеджер уволен - меняем ответственного на менее занятого
        if (!user[0].ACTIVE) updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser;
        break;

      // Если лид в активных стадиях - уведомляем менеджера и его руководителя
      case B24LeadActiveStages.includes(STATUS_ID):
        // Если менеджер уволен - меняем ответственного на менее занятого
        if (!user[0].ACTIVE) updateLeadFields.ASSIGNED_BY_ID = minWorkflowUser;

        if (
          updateLeadFields.ASSIGNED_BY_ID !==
          this.bitrixService.getConstant('ZLATA_ZIMINA_BITRIX_ID')
        ) {
          batchCommandsUpdateLead['send_message_head'] = {
            method: 'im.message.add',
            params: {
              DIALOG_ID: this.bitrixService.getConstant(
                'ZLATA_ZIMINA_BITRIX_ID',
              ),
              MESSAGE:
                '[b]ПРИОРИТЕТ ПО РАБОТЕ С ЛИДОМ! КЛИЕНТ ВАШЕГО МЕНЕДЖЕРА ИЩЕТ ДАЛЬШЕ! ' +
                'ВАМ НЕОБХОДИМО ПРОКОНТРОЛИРОВАТЬ ЧТОБЫ МЕНЕДЖЕР НАБРАЛ КЛИЕНТУ В ТЕЧЕНИЕ 10 МИНУТ![/b][br][br]' +
                `Лид: ${this.bitrixService.generateLeadUrl(leadId)}` +
                `[br]C авито: ${avito}` +
                `[br]Сообщение:[br]>>${message.join('[br]>>')}[br]` +
                `${service_text ? 'Выбранная услуга: ' + service_text : ''}`,
            },
          };
        }

        batchCommandsUpdateLead['send_message_manager'] = {
          method: 'im.message.add',
          params: {
            DIALOG_ID: updateLeadFields.ASSIGNED_BY_ID,
            MESSAGE:
              '[b]ПРИОРИТЕТ ПО РАБОТЕ С ЛИДОМ! ВАШ КЛИЕНТ ИЩЕТ ДАЛЬШЕ! ВАМ НЕОБХОДИМО НАБРАТЬ КЛИЕНТУ В ТЕЧЕНИЕ 10 МИНУТ![/b][br][br]Лид: ' +
              this.bitrixService.generateLeadUrl(leadId) +
              `[br]C авито: ${avito}[br]Сообщение:[br]>>${message.join('[br]>>')}[br][br][b]Скрипт:[/b]` +
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
        const notifyMessage =
          `${B24Emoji.SUCCESS} [b]Действующий клиент обратился через Авито. ` +
          'Необходимо посмотреть действующие сделки ' +
          'и, при необходимости, распределить лид в работу[/b][br]' +
          this.bitrixService.generateLeadUrl(leadId) +
          `[br]С авито: ${avito}` +
          `[br]Сообщение:[br]>>${message.join('[br]>>')}`;

        batchCommandsUpdateLead['send_message_converted'] = {
          method: 'im.message.add',
          params: {
            DIALOG_ID: this.bitrixService.getConstant('ZLATA_ZIMINA_BITRIX_ID'),
            MESSAGE: notifyMessage,
          },
        };

        // Отправляем сообщение Ксении Чешковой
        batchCommandsUpdateLead['send_message_to_kesina_cheshkova'] = {
          method: 'im.message.add',
          params: {
            DIALOG_ID: '464',
            MESSAGE: notifyMessage,
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
          COMMENT:
            `Клиент обращался на ${avito}: [${avito_number}]\n` +
            `Имя клиента: ${client_name}\n` +
            (region ? `Регион: ${region}` : '') +
            (city ? `Город: ${city}` : '') +
            `${message.join('\n')}`,
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

    this.bitrixService.callBatch(batchCommandsUpdateLead).then((res) =>
      this.logger.debug({
        request: batchCommandsUpdateLead,
        response: res,
      }),
    );

    if (
      now.toDateString() !== leadDateCreate.toDateString() &&
      B24LeadRejectStages.includes(STATUS_ID)
    ) {
      leadStatusType = B24LeadStatus.NONACTIVE;
    } else if (now.toDateString() === leadDateCreate.toDateString()) {
      leadStatusType = B24LeadStatus.NEW;
    } else {
      leadStatusType = B24LeadStatus.ACTIVE;
    }

    return {
      wiki_lead_id: wiki_lead_id,
      lead_id: leadId,
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
  public async distributeClientRequestFromAvitoByAI(
    fields: AvitoCreateLeadDto,
  ) {
    const message =
      '[b]AI Avito[/b][br]Нужно отправить лид в работу:[br]' +
      `С авито: ${fields.avito}[br][br]>>` +
      fields.message.join('[br]>>').replaceAll(/\n/gi, '[br]>>');

    const keyboardParams: ImbotApproveDistributeLeadFromAvitoByAi = {
      message: this.bitrixBot.encodeText(message),
      fields: fields,
      approved: true,
      phone: fields.phone,
    };

    this.bitrixService.callBatch({
      send_message: {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixService.getConstant('BOT_ID'),
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
