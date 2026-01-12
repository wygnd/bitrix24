import { BadRequestException, Injectable } from '@nestjs/common';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';
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

@Injectable()
export class BitrixWikiUseCase {
  private readonly logger = new WinstonLogger(
    BitrixWikiUseCase.name,
    'bitrix:wiki'.split(':'),
  );

  constructor(
    private readonly bitrixService: BitrixUseCase,
    private readonly wikiService: WikiService,
    private readonly bitrixDeals: BitrixDealsUseCase,
    private readonly bitrixBot: BitrixBotUseCase,
    private readonly bitrixWikiClientPayments: BitrixWikiClientPaymentsUseCase,
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
  }: B24WikiPaymentsNoticeWaitingOptions) {
    try {
      let leadId = lead_id;
      let dealId = deal_id;
      const isBudget = /бюджет/gi.test(message);
      const [, , , , , , inn = ''] = message.split(' | ');

      if (!deal_id && !leadId)
        throw new BadRequestException('Invalid lead and deals ids');

      // Получаем информацию о сделке
      if (!dealId) {
        const deals = await this.bitrixDeals.getDeals({
          filter: {
            UF_CRM_1731418991: leadId, // Лид айди
          },
          select: ['ID'],
          start: 0,
        });

        if (deals.length == 0)
          throw new BadRequestException(
            `Invalid get deal by lead id: ${leadId}`,
          );

        dealId = deals[0].ID;
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

      const messageId = await this.bitrixBot.sendMessage({
        DIALOG_ID: this.bitrixService.getConstant('TEST_CHAT_ID'),
        MESSAGE: '[b]TEST[/b][br][br]' + message,
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

      return { messageId: messageId ?? null };
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
  ) {
    const { message, group: chatId } = fields;
    const [, , , , inn] = message.split(' | ');
    let clientDepartmentHistory = '';

    // Если есть ИНН
    // нужно в сообщение добавлять названия отделов, с которыми работал клиент
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

    const messageId = await this.bitrixBot.sendMessage({
      DIALOG_ID: this.bitrixService.getConstant('TEST_CHAT_ID'),
      // DIALOG_ID: chatId,
      MESSAGE: message + clientDepartmentHistory,
    });

    return { messageId };
  }
}
