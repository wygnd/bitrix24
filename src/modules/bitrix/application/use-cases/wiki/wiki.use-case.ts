import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WikiService } from '@/modules/wiki/wiki.service';
import { BitrixDealsUseCase } from '@/modules/bitrix/application/use-cases/deals/deals.use-case';
import { BitrixBotUseCase } from '@/modules/bitrix/application/use-cases/bot/bot.use-case';
import { BitrixWikiClientPaymentsUseCase } from '@/modules/bitrix/application/use-cases/wiki/wiki-client-payments.use-case';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { UnloadLostCallingResponse } from '@/modules/bitrix/application/interfaces/wiki/wiki-unload-lost-calling.interface';
import { UnloadLostCallingDto } from '@/modules/bitrix/application/dtos/wiki/wiki-unload-lost-calling.dto';
import { B24WikiPaymentsNoticeWaitingOptions } from '@/modules/bitrix/application/interfaces/wiki/wiki-payments-notice-waiting.inteface';
import { ImbotKeyboardPaymentsNoticeWaiting } from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-payments-notice-waiting.interface';
import { B24WikiPaymentsNoticeReceiveOptions } from '@/modules/bitrix/application/interfaces/wiki/wiki-payments-notice-receive.inteface';
import { B24User } from '@/modules/bitrix/application/interfaces/users/user.interface';
import { B24Department } from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { B24_WIKI_PAYMENTS_CHAT_IDS_BY_FLAG } from '@/modules/bitrix/application/constants/wiki/wiki-payments.constants';
import { B24ImbotSendMessageOptions } from '@/modules/bitrix/application/interfaces/bot/imbot.interface';
import { ImbotKeyboardDefineUnknownPaymentOptions } from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-define-unknown-payment.interface';
import { B24WikiNPaymentsNoticesResponse } from '@/modules/bitrix/application/interfaces/wiki/wiki-response.interface';
import { BitrixWikiPaymentsNoticeExpenseOptions } from '@/modules/bitrix/application/interfaces/wiki/wiki-payments-notice-expense.interface';
import { BitrixWikiDistributeLeadWishManager } from '@/modules/bitrix/application/interfaces/wiki/wiki-distribute-lead-wish-manager.interface';
import {
  B24LeadActiveStages,
  B24LeadNewStages,
} from '@/modules/bitrix/application/constants/leads/lead.constants';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { B24Lead } from '@/modules/bitrix/application/interfaces/leads/lead.interface';
import { B24Activity } from '@/modules/bitrix/application/interfaces/activities/activities.interface';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';

@Injectable()
export class BitrixWikiUseCase {
  private readonly logger = new WinstonLogger(
    BitrixWikiUseCase.name,
    'bitrix:wiki'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    private readonly wikiService: WikiService,
    private readonly bitrixDeals: BitrixDealsUseCase,
    private readonly bitrixBot: BitrixBotUseCase,
    private readonly bitrixWikiClientPayments: BitrixWikiClientPaymentsUseCase,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Function find duplicates by phones. If not found and set **needCreate** at 1 create leads
   *
   * ---
   *
   * Функция ищет дубликаты по номерам. Если не нашла и передан флаг **needCreate** в значении 1 создает лиды
   *
   * @param fields
   * @param needCreate
   */
  public async unloadLostCalling({
    fields,
    needCreate = 0,
  }: UnloadLostCallingDto) {
    const uniquePhones = new Map<string, string>();

    // Оставляем уникальные номера
    fields.forEach(({ phone, datetime }) => {
      if (uniquePhones.has(phone)) uniquePhones.delete(phone);

      uniquePhones.set(phone, datetime);
    });

    // Получаем менеджеров, которые работают
    const users = await this.wikiService.getWorkingSales();
    const batchCommandsBatches: B24BatchCommands[] = [];
    let batchIndex = 0;

    // Проходим по номерам и добавляем запросы для поиска дубликатов
    uniquePhones.forEach((datetime, phone) => {
      if (
        batchIndex in batchCommandsBatches &&
        Object.keys(batchCommandsBatches[batchIndex]).length === 50
      )
        batchIndex++;

      if (
        !(batchIndex in batchCommandsBatches) ||
        Object.keys(batchCommandsBatches[batchIndex]).length == 0
      )
        batchCommandsBatches[batchIndex] = {};

      batchCommandsBatches[batchIndex][`find_duplicates=${phone}=${datetime}`] =
        {
          method: 'crm.duplicate.findbycomm',
          params: {
            type: 'PHONE',
            values: [phone],
            entity_type: 'LEAD',
          },
        };
    });

    // Выполняем запрос
    const batchResponse = await Promise.all(
      batchCommandsBatches.map((batchCommands) =>
        this.bitrixService
          .callBatch(batchCommands)
          .then((res) => res.result.result),
      ),
    );

    const phonesNeedCreateLead: Map<string, string> = new Map();
    const resultPhones: Set<UnloadLostCallingResponse> = new Set();

    // Проходимся по результату запроса от битркис
    batchResponse.forEach((batchResponseList) => {
      Object.entries(batchResponseList).forEach(([command, bResponse]) => {
        const [_, phone, datetime] = command.split('=');

        if (Array.isArray(bResponse)) {
          phonesNeedCreateLead.set(phone, datetime);
          return;
        }

        resultPhones.add({
          leadId: bResponse.LEAD[0],
          phone: phone,
          status: 'exists',
        });
      });
    });

    if (phonesNeedCreateLead.size === 0) return [...resultPhones];

    // Если был указан флаг needCreate: создаем лиды
    if (needCreate === 1) {
      const batchCommandsCreateLeadsBatches: B24BatchCommands[] = [];
      batchIndex = 0;
      let userIndex = 0;

      phonesNeedCreateLead.forEach((datetime, phone) => {
        if (
          batchIndex in batchCommandsCreateLeadsBatches &&
          Object.keys(batchCommandsCreateLeadsBatches[batchIndex]).length === 50
        )
          batchIndex++;

        if (
          !(batchIndex in batchCommandsCreateLeadsBatches) ||
          Object.keys(batchCommandsCreateLeadsBatches[batchIndex]).length == 0
        )
          batchCommandsCreateLeadsBatches[batchIndex] = {};

        if (userIndex + 1 >= users.length) userIndex = 0;

        batchCommandsCreateLeadsBatches[batchIndex][`create_lead=${phone}`] = {
          method: 'crm.lead.add',
          params: {
            fields: {
              UF_CRM_1651577716: '7420',
              STATUS_ID: '3',
              PHONE: [
                {
                  VALUE: phone,
                  VALUE_TYPE: 'WORK',
                },
              ],
              ASSIGNED_BY_ID: users[userIndex],
            },
          },
        };
        batchCommandsCreateLeadsBatches[batchIndex][`add_comment=${phone}`] = {
          method: 'crm.timeline.comment.add',
          params: {
            fields: {
              ENTITY_ID: `$result[create_lead=${phone}]`,
              ENTITY_TYPE: 'lead',
              COMMENT: `Лид был создан ${datetime} и не был добавлен из-за сбоя в системе. Учитывайте в работе`,
              AUTHOR_ID: '460',
            },
          },
        };
        batchCommandsCreateLeadsBatches[batchIndex][`pin_comment=${phone}`] = {
          method: 'crm.timeline.item.pin',
          params: {
            id: `$result[add_comment=${phone}]`,
            ownerTypeId: '1',
            ownerId: `$result[create_lead=${phone}]`,
          },
        };

        userIndex++;
      });

      const batchResponseCreateLead = await Promise.all(
        batchCommandsCreateLeadsBatches.map((batchCommands) =>
          this.bitrixService.callBatch(batchCommands),
        ),
      );

      batchResponseCreateLead.forEach((batchResponseCreateLeadList) => {
        Object.entries(batchResponseCreateLeadList.result.result).forEach(
          ([command, result]) => {
            const [commandName, phone] = command.split('=');

            if (commandName !== 'create_lead') return;

            resultPhones.add({
              leadId: result,
              phone: phone,
              status: 'new',
            });
          },
        );
      });
    } else {
      phonesNeedCreateLead.forEach((_, phone) => {
        resultPhones.add({
          leadId: '',
          phone: phone,
          status: 'not-created',
        });
      });
    }

    return [...resultPhones];
  }

  /**
   * Handle receive notice waiting and send message in chat
   *
   * ---
   * Обрабатывает ожидание платежа и отправляет сообщение в чат
   *
   * @param userId
   * @param organizationName
   * @param message
   * @param deal_id
   * @param lead_id
   * @param user_role
   */
  public async sendNoticeWaitingPayment({
    user_bitrix_id: userId,
    name_of_org: organizationName,
    message,
    deal_id,
    lead_id,
    user_role: chatId,
  }: B24WikiPaymentsNoticeWaitingOptions): Promise<B24WikiNPaymentsNoticesResponse> {
    try {
      let leadId = lead_id;
      let dealId = deal_id;
      const isBudget = /бюджет/gi.test(message);
      const [, , , , , , inn = ''] = message.split(' | ');

      if (!deal_id && !leadId)
        throw new BadRequestException('Invalid lead and deals ids');

      // Получаем информацию о сделке
      if (!dealId) {
        const deals = await this.bitrixDeals.getDeals(
          {
            filter: {
              UF_CRM_1731418991: leadId, // Лид айди
            },
            select: ['ID'],
            start: 0,
          },
          'force',
        );

        if (deals.length > 0) dealId = deals[0]?.ID;
      }

      const keyboardParams: ImbotKeyboardPaymentsNoticeWaiting = {
        message: this.bitrixBot.encodeText(message),
        dialogId: chatId,
        organizationName: organizationName,
        dealId: dealId,
        isBudget: isBudget,
        userId: userId,
      };

      if (inn.length > 0) {
        const {
          result: {
            result: { get_user_department: departmentInfo },
          },
        } = await this.bitrixService.callBatch<{
          get_user: B24User[];
          get_user_department: B24Department[];
        }>({
          get_user: {
            method: 'user.get',
            params: {
              filter: {
                ID: userId,
              },
            },
          },
          get_user_department: {
            method: 'department.get',
            params: {
              ID: '$result[get_user][0][UF_DEPARTMENT][0][ID]',
            },
          },
        });

        if (departmentInfo.length > 0) {
          this.bitrixWikiClientPayments.addPayment({
            inn: inn,
            departmentId: Number(departmentInfo[0].ID),
            departmentName: departmentInfo[0].NAME,
          });
        }
      }

      // Отправляем сообщение
      const messageId = await this.bitrixBot.sendMessage({
        DIALOG_ID: chatId,
        MESSAGE: message,
        KEYBOARD: [
          {
            TEXT: isBudget ? 'Бюджет' : 'Платеж поступил',
            COMMAND: 'approveReceivedPayment',
            COMMAND_PARAMS: JSON.stringify(keyboardParams),
            BLOCK: 'Y',
            BG_COLOR_TOKEN: isBudget ? 'secondary' : 'primary',
          },
        ],
      });

      return { message_id: messageId ?? null };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Handle receive payment: send message in chat
   *
   * ---
   *
   * Обрабатывает принятие платежа: отправляет сообщение в чат
   * @param fields
   */
  public async sendNoticeReceivePayment(
    fields: B24WikiPaymentsNoticeReceiveOptions,
  ): Promise<B24WikiNPaymentsNoticesResponse> {
    try {
      const { message, group, payment_id } = fields;
      const chatId =
        group in B24_WIKI_PAYMENTS_CHAT_IDS_BY_FLAG
          ? B24_WIKI_PAYMENTS_CHAT_IDS_BY_FLAG[group]
          : B24_WIKI_PAYMENTS_CHAT_IDS_BY_FLAG[0];

      const [, , , , inn] = message.split(' | ');
      let clientDepartmentHistory = '';

      // Если есть ИНН нужно в сообщение добавлять названия отделов, с которыми работал клиент
      if (/инн/gi.test(inn)) {
        const paymentsSet = new Set<number>();
        const payments = await this.bitrixWikiClientPayments.getPaymentList({
          where: {
            inn: this.bitrixService.clearNumber(inn),
          },
          attributes: ['id', 'departmentName', 'departmentId'],
        });

        if (payments.length > 0) {
          clientDepartmentHistory +=
            `[br][br]` +
            payments
              .map(({ departmentName, departmentId }) => {
                if (paymentsSet.has(departmentId)) return null;
                paymentsSet.add(departmentId);
                return departmentName;
              })
              .filter((p) => p)
              .join(', ');
        }
      }

      const sendMessageOptions: Omit<B24ImbotSendMessageOptions, 'BOT_ID'> = {
        DIALOG_ID: chatId,
        MESSAGE: message + clientDepartmentHistory,
        KEYBOARD: [],
      };

      if (group == '0')
        sendMessageOptions.MESSAGE +=
          '[br][br][b]Данные клиента находятся в БД и Addy и Grampus. Необходимо выяснить на чьей стороне ожидание и зафиксировать их.[/b]';

      if (group == '-1')
        sendMessageOptions.MESSAGE +=
          '[br][br][b]Данные клиента НЕ находятся в БД и Addy и Grampus. Необходимо выяснить на чьей стороне ожидание и зафиксировать их.[/b]';

      if (['-1', '0'].includes(group)) {
        sendMessageOptions.KEYBOARD = [
          {
            TEXT: 'Определить платеж',
            COMMAND: 'defineUnknownPayment',
            COMMAND_PARAMS: JSON.stringify({
              group: group,
              paymentId: payment_id,
              message: this.bitrixBot.encodeText(message),
            } as ImbotKeyboardDefineUnknownPaymentOptions),
            DISPLAY: 'BLOCK',
            BLOCK: 'Y',
            BG_COLOR_TOKEN: 'primary',
          },
        ];
      }

      const messageId = await this.bitrixBot.sendMessage(sendMessageOptions);

      this.logger.debug({
        handler: this.sendNoticeReceivePayment.name,
        body: fields,
        commands: sendMessageOptions,
        response: messageId,
      });

      return { message_id: messageId };
    } catch (error) {
      this.logger.error({
        handler: this.sendNoticeReceivePayment.name,
        fields,
        error,
      });
      throw error;
    }
  }

  /**
   * Send message to G Credit chat
   *
   * ---
   *
   * Отправляет сообщение в G Credit
   * @param fields
   */
  public async sendNoticeExpensePayment(
    fields: BitrixWikiPaymentsNoticeExpenseOptions,
  ) {
    try {
      const { message, extra_chat_id: extraChatId = '0' } = fields;

      const batchCommands: B24BatchCommands = {
        send_message_to_chat: {
          method: 'imbot.message.add',
          params: {
            BOT_ID: this.bitrixService.getConstant('BOT_ID'),
            DIALOG_ID: this.bitrixService.getConstant('GRAMPUS').GCreditChatId,
            MESSAGE: message,
          },
        },
      };

      if (extraChatId != '0') {
        batchCommands['send_message_to_extra_chat'] = {
          method: 'im.message.add',
          params: {
            DIALOG_ID: extraChatId,
            MESSAGE: message,
          },
        };
      }

      this.bitrixService.callBatch(batchCommands).then((res) =>
        this.logger.debug({
          request: batchCommands,
          response: res,
        }),
      );

      return {
        status: true,
        message: 'Successfully sent message',
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Distribute lead from new stages on manager which push button on wiki if lead exists
   *
   * ---
   *
   * Распределяет лид из новых стадий на менеджера, который нажал кнопку на вики
   * @param fields
   */
  public async distributeLeadOnWishManager(
    fields: BitrixWikiDistributeLeadWishManager,
  ) {
    try {
      const { user_id: userId } = fields;

      const userWasPushing =
        (await this.redisService.get<string>(
          REDIS_KEYS.BITRIX_DATA_WIKI_DISTRIBUTE_LEAD_WISH_MANAGER + userId,
        )) ?? '0';

      // Если пользователь отправил запрос после 2-х успешных
      if (Number(userWasPushing) >= 2)
        throw new ConflictException({
          status: false,
          message: 'За час можно взять только 2 лида',
        });

      // Получаем лиды, которые находятся в новых стадиях
      const {
        result: {
          result: {
            get_leads: leads,
            get_user: users,
            get_user_leads: userLeads,
            get_lead_activity: leadActivities,
          },
        },
      } = await this.bitrixService.callBatch<{
        get_leads: B24Lead[];
        get_user: B24User[];
        get_user_leads: B24Lead[];
        get_lead_activity: B24Activity[];
      }>({
        get_leads: {
          method: 'crm.lead.list',
          params: {
            filter: {
              '@STATUS_ID': B24LeadNewStages,
            },
            select: ['ID'],
            start: 0,
          },
        },
        get_user: {
          method: 'user.get',
          params: {
            filter: {
              ID: userId,
            },
          },
        },
        get_user_leads: {
          method: 'crm.lead.list',
          params: {
            filter: {
              ASSIGNED_BY_ID: userId,
              STATUS_ID: B24LeadActiveStages[0], // Новый в работе
            },
          },
        },
        get_lead_activity: {
          method: 'crm.activity.list',
          params: {
            filter: {
              OWNER_ID: '$result[get_leads][0][ID]',
              OWNER_TYPE_ID: '1',
            },
          },
        },
      });

      // Если пользователь не найден
      if (users.length === 0)
        throw new NotFoundException({
          status: false,
          message: 'Пользователь не найден',
        });

      // Если пользователь уволен
      if (!users[0].ACTIVE)
        throw new UnprocessableEntityException({
          status: false,
          message: 'Пользователь уволен',
        });

      // Если лидов не найдено
      if (leads.length === 0)
        throw new NotFoundException({
          status: false,
          message: 'Лидов не найдено',
        });

      // Если у пользователя больше 10 активных лидов
      if (userLeads.length > 10)
        throw new UnprocessableEntityException({
          status: false,
          message: 'У тебя и так много лидов',
        });

      const [{ ID: leadId }] = leads;
      const batchCommandsUpdateLead: B24BatchCommands = {
        // Обновляем лид
        update_lead: {
          method: 'crm.lead.update',
          params: {
            id: leadId,
            fields: {
              ASSIGNED_BY_ID: userId,
              STATUS_ID: B24LeadActiveStages[0], // Новый в работе
            },
          },
        },
        // Отправляем менеджеру сообщение с сылкой на лид
        notify_about_update_lead: {
          method: 'im.message.add',
          params: {
            DIALOG_ID: userId,
            MESSAGE:
              'Вы взяли лид в работу ' +
              this.bitrixService.generateLeadUrl(leadId) +
              '[br]Набирайте клиенту сразу.',
          },
        },
      };

      // Если есть звонки переводим ответственного
      if (leadActivities.length > 0) {
        leadActivities.forEach((activity) => {
          batchCommandsUpdateLead[`update_lead_activity=${activity.ID}`] = {
            method: 'crm.activity.update',
            params: {
              id: activity.ID,
              fields: {
                OWNER_TYPE_ID: '1',
                OWNER_ID: leadId,
                RESPONSIBLE_ID: userId,
              },
            },
          };
        });
      }

      const {
        result: {
          result: { update_lead: responseUpdateLead },
        },
      } = await this.bitrixService.callBatch<{
        update_lead: boolean;
      }>(batchCommandsUpdateLead);

      if (!responseUpdateLead)
        throw new InternalServerErrorException({
          status: false,
          message: 'Произошла внутренняя ошибка, обратитесь к bitrix master',
        });

      this.redisService.set<string>(
        REDIS_KEYS.BITRIX_DATA_WIKI_DISTRIBUTE_LEAD_WISH_MANAGER + userId,
        `${Number(userWasPushing) + 1}`,
        3600, // 1 hour
      );

      this.logger.debug({
        method: 'distributeLeadOnWishManager',
        body: fields,
        response: leadId,
      });

      return {
        status: true,
        message:
          'Лид успешно распределен: ' +
          this.bitrixService.generateLeadUrl(leadId),
      };
    } catch (error) {
      this.logger.error({
        method: 'distributeLeadOnWishManager',
        body: fields,
        error,
      });
      throw error;
    }
  }

  /**
   * Notice about users which don start work days
   */
  public async noticeUsersWhichDontStartWorkDay() {
    try {
      // Получаем список bitrix_id менеджеров
      const userIds = await this.wikiService.getMissDaysWorkers();

      if (userIds.length === 0)
        throw new UnprocessableEntityException('Пользователей не найдено');

      let batchIndex = 0;
      const batchCommandsMap = new Map<number, B24BatchCommands>();

      // Проходим по списку пользователей и формируем запросы на получения пользователя и его руководителя
      userIds.forEach((userId) => {
        let commands = batchCommandsMap.get(batchIndex) ?? {};

        if (Object.keys(commands).length === 50) {
          batchIndex++;
          commands = batchCommandsMap.get(batchIndex) ?? {};
        }

        commands[`get_user=${userId}`] = {
          method: 'user.get',
          params: {
            filter: {
              ID: userId,
            },
          },
        };

        if (Object.keys(commands).length === 50) {
          batchCommandsMap.set(batchIndex, commands);
          batchIndex++;
          commands = batchCommandsMap.get(batchIndex) ?? {};
        }

        commands[`get_user_department=${userId}`] = {
          method: 'department.get',
          params: {
            ID: `$result[get_user=${userId}][0][UF_DEPARTMENT][0]`,
          },
        };

        batchCommandsMap.set(batchIndex, commands);
      });

      // Выполняем запрос
      const batchResponses = await Promise.all(
        Array.from(batchCommandsMap.values()).map((commands) =>
          this.bitrixService.callBatch<
            Record<string, B24User[] | B24Department[]>
          >(commands),
        ),
      );

      // Проверяем запрос на ошибки, если есть возвращаем ошибки
      let batchErrors = this.bitrixService.checkBatchErrors(batchResponses);

      if (batchErrors.length > 0)
        throw new UnprocessableEntityException(batchErrors);

      const headManagerNotWorkingMap = new Map<string, string[]>();

      // Проходим по ответу от битрикса и формируем мапу руководитель - менеджеры
      batchResponses.forEach(({ result: { result } }) => {
        Object.entries(result).forEach(([command, response]) => {
          const [commandName, userId] = command.split('=');

          if (
            commandName !== 'get_user_department' ||
            response.length == 0 ||
            'ACTIVE' in response[0]
          )
            return;

          const [{ UF_HEAD: headUserId }] = response;

          const userIds = headManagerNotWorkingMap.get(headUserId) ?? [];
          userIds.push(userId);
          headManagerNotWorkingMap.set(headUserId, userIds);
        });
      });

      if (headManagerNotWorkingMap.size === 0)
        throw new NotFoundException('Пользователи не найдены');

      batchIndex = 0;
      batchCommandsMap.clear();

      // Проходим по сформированной мапе и формируем запросы на отправку сообщений в чат
      headManagerNotWorkingMap.forEach((userIds, headUserId) => {
        if (userIds.length === 0) return;

        let commands = batchCommandsMap.get(batchIndex) ?? {};

        if (Object.keys(commands).length === 50) {
          batchIndex++;
          commands = batchCommandsMap.get(batchIndex) ?? {};
        }

        let message = '';

        userIds.forEach((userId) => {
          message +=
            `Менеджер [user=${userId}][/user] не начинал рабочий день более 2х дней.[br]` +
            `Ответственному руководителю [user=${headUserId}][/user] или замещающему, необходимо:[br]` +
            '- Переназначить лиды добавленные за последние 2 недели на других менеджеров[br]' +
            '- Проверить все горячие лиды и ожидания и при необходимости прозвонить клиентам самим[br][br]';
        });

        commands[`notify_head=${headUserId}`] = {
          method: 'imbot.message.add',
          params: {
            BOT_ID: this.bitrixService.getConstant('BOT_ID'),
            DIALOG_ID: this.bitrixService.getConstant('TEST_CHAT_ID'),
            MESSAGE: message,
          },
        };

        batchCommandsMap.set(batchIndex, commands);
      });

      // Выополняем запросы
      Promise.all(
        Array.from(batchCommandsMap.values()).map((commands) =>
          this.bitrixService.callBatch(commands),
        ),
      ).then((res) =>
        this.logger.debug({
          handler: this.noticeUsersWhichDontStartWorkDay.name,
          request: [...batchCommandsMap.values()],
          response: res,
        }),
      );

      return {
        status: true,
        message: 'Messages was sending to head users',
      };
    } catch (error) {
      this.logger.error({
        handler: this.noticeUsersWhichDontStartWorkDay.name,
        error,
      });
      throw error;
    }
  }
}
