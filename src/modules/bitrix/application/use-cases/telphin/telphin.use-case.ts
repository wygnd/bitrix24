import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { BitrixEventsAnswerOptions } from '@/modules/bitrix/application/interfaces/telphin/telphin-events.interface';
import { TelphinExtensionItemExtraParams } from '@/modules/telphin/interfaces/telphin-extension.interface';
import { BitrixTelphinEventsHandleAnswerCallForSaleDepartment } from '@/modules/bitrix/application/interfaces/telphin/telphin-events-handle.interface';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import {
  B24LeadActiveStages,
  B24LeadNewStages,
  } from '@/modules/bitrix/application/constants/leads/lead.constants';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import type { BitrixLeadsPort } from '@/modules/bitrix/application/ports/leads/leads.port';
import type { BitrixMessagesPort } from '@/modules/bitrix/application/ports/messages/messages.port';
import { AvitoPhoneList } from '@/modules/bitrix/application/constants/avito/avito.constants';

@Injectable()
export class BitrixTelphinUseCase {
  constructor(
    private readonly telphinService: TelphinService,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(B24PORTS.LEADS.LEADS_DEFAULT)
    private readonly bitrixLeads: BitrixLeadsPort,
    @Inject(B24PORTS.MESSAGES.MESSAGES_DEFAULT)
    private readonly bitrixMessages: BitrixMessagesPort,
  ) {}

  async handleAnswerCall(fields: BitrixEventsAnswerOptions) {
    const {
      CalledExtensionID,
      CallerIDNum: clientPhone,
      CallStatus: callStatus,
      CalledDID: calledDid,
      CallFlow: callFlow,
    } = fields;

    if (callFlow !== 'in')
      return {
        status: false,
        message: `Call hasn't flow in: ${callFlow}`,
      };

    if (callStatus !== 'ANSWER')
      return {
        status: false,
        message: `Call has not status answer: [${callStatus}]`,
      };

    if (!CalledExtensionID)
      throw new BadRequestException(
        `Invalid extension id: ${CalledExtensionID}`,
      );

    const extensionId = Number(CalledExtensionID);

    // Получаем информацию о внутреннем номере
    const extensionData =
      await this.telphinService.getClientExtensionById(extensionId);

    if (!extensionData)
      throw new NotFoundException(`Extension wasn't found: ${extensionId}`);

    // Деструктуризируем объект
    const {
      extension_group_id: extensionGroupId,
      extra_params: extensionExtraParams,
    } = extensionData;

    // Парсим поле
    const extensionExtraParamsParsed = JSON.parse(
      extensionExtraParams,
    ) as TelphinExtensionItemExtraParams;

    // В поле comment заложен id пользователя битрикс, если его нет кидаем ошибку
    if (!extensionExtraParamsParsed?.comment)
      throw new BadRequestException(`Extension hasn't userId: ${extensionId}`);

    // Получаем группу внутреннего номера
    const extensionGroupData =
      await this.telphinService.getExtensionGroupById(extensionGroupId);

    if (!extensionGroupData)
      throw new NotFoundException(
        `Extension group was not found: ${extensionGroupId}`,
      );

    // Распределяем в зависимости от группы
    switch (true) {
      case /sale/gi.test(extensionGroupData.name):
        return this.handleAnswerCallForSaleDepartment({
          phone: clientPhone,
          userId: extensionExtraParamsParsed.comment,
          calledDid: calledDid,
        });

      default:
        return {
          status: false,
          message: 'Not handled yet on call start',
        };
    }
  }

  /**
   * Handle answer call for sale departments
   *
   * ---
   *
   * Обработка ответа на звонок для отдела продаж
   * @param fields
   * @private
   */
  private async handleAnswerCallForSaleDepartment(
    fields: BitrixTelphinEventsHandleAnswerCallForSaleDepartment,
  ) {
    const { userId, phone, calledDid } = fields;
    const batchCommands: B24BatchCommands = {};

    // Ищем лиды по номеру клиента
    const leadIds = await this.bitrixLeads.getDuplicateLeadsByPhone(
      phone,
      'force',
    );

    if (leadIds.length === 0) {
      // Если нет лида: создаем
      batchCommands['create_lead'] = {
        method: 'crm.lead.add',
        params: {
          fields: {
            ASSIGNED_BY_ID: userId,
            STATUS_ID: B24LeadActiveStages[0], // Новый в работе
            PHONE: [
              {
                VALUE: phone,
                VALUE_TYPE: 'WORK',
              },
            ],
          },
        },
      };
    } else {
      // Если нашли лид, обновляем
      const leadInfo = await this.bitrixLeads.getLeadById(
        leadIds[0].toString(),
      );

      if (!leadInfo) throw new BadRequestException('Lead was not found');

      const {
        ID: leadId,
        STATUS_ID: leadStatusId,
        ASSIGNED_BY_ID: leadAssignedId,
      } = leadInfo;

      this.bitrixMessages.sendPrivateMessage({
        DIALOG_ID: leadAssignedId,
        MESSAGE:
          'Твой клиент звонил ' +
          `${calledDid && calledDid in AvitoPhoneList ? `на авито [b][${AvitoPhoneList[calledDid]}][/b]` : ''}[br]` +
          this.bitrixService.generateLeadUrl(leadId),
      });

      switch (true) {
        case B24LeadNewStages.includes(leadStatusId): // Лид в новых стадиях
          batchCommands['update_lead'] = {
            method: 'crm.lead.update',
            params: {
              id: leadId,
              fields: {
                ASSIGNED_BY_ID: userId,
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
              },
            },
          };
          break;
      }
    }

    return {
      status: true,
      message: 'Successfully handled start call',
      response: await this.bitrixService.callBatch(batchCommands),
    };
  }
}
