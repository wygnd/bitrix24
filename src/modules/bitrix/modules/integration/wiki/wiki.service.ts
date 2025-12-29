import { BadRequestException, Injectable } from '@nestjs/common';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { UnloadLostCallingResponse } from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-unload-lost-calling.interface';
import { UnloadLostCallingDto } from '@/modules/bitrix/modules/integration/wiki/dtos/wiki-unload-lost-calling.dto';
import { WikiService } from '@/modules/wiki/wiki.service';
import { B24WikiPaymentsNoticeWaitingOptions } from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-payments-notice-waiting.inteface';
import { BitrixDealService } from '@/modules/bitrix/modules/deal/deal.service';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { ImbotKeyboardPaymentsNoticeWaiting } from '@/modules/bitrix/modules/imbot/interfaces/imbot-keyboard-payments-notice-waiting.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { B24WikiPaymentsNoticeReceiveOptions } from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-payments-notice-receive.inteface';

@Injectable()
export class BitrixWikiService {
  private readonly logger = new WinstonLogger(
    BitrixWikiService.name,
    'bitrix:services:integration:wiki'.split(':'),
  );

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly wikiService: WikiService,
    private readonly bitrixDealService: BitrixDealService,
    private readonly bitrixImbotService: BitrixImBotService,
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
    const users = await this.wikiService.getWorkingSalesFromWiki();
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
          .callBatch<B24BatchResponseMap>(batchCommands)
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
          this.bitrixService.callBatch<B24BatchResponseMap>(batchCommands),
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

      if (!deal_id && !leadId)
        throw new BadRequestException('Invalid lead and deal ids');

      // Получаем информацию о сделке
      if (!dealId) {
        const { result: deals } = await this.bitrixDealService.getDeals({
          filter: {
            UF_CRM_1731418991: leadId, // Лид айди
          },
          select: ['ID'],
          start: 0,
        });

        if (!deals || deals.length == 0)
          throw new BadRequestException(
            `Invalid get deal by lead id: ${leadId}`,
          );

        dealId = deals[0].ID;
      }

      const keyboardParams: ImbotKeyboardPaymentsNoticeWaiting = {
        message: this.bitrixImbotService.encodeText(message),
        dialogId: chatId,
        organizationName: organizationName,
        dealId: dealId,
        isBudget: isBudget,
        userId: userId,
      };

      const { result: messageId } = await this.bitrixImbotService.sendMessage({
        DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
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
      this.logger.error(error, true);
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

    const { result: messageId } = await this.bitrixImbotService.sendMessage({
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      // DIALOG_ID: chatId,
      MESSAGE: message,
    });

    return { messageId };
  }
}
