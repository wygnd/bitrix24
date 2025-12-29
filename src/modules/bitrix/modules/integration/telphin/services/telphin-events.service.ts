import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BitrixEventsAnswerOptions } from '@/modules/bitrix/modules/integration/telphin/interfaces/telphin-events.interface';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { BitrixTelphinEventsHandleAnswerCallForSaleDepartment } from '@/modules/bitrix/modules/integration/telphin/interfaces/telphin-events-handle.interface';
import { TelphinExtensionItemExtraParams } from '@/modules/telphin/interfaces/telphin-extension.interface';
import { BitrixLeadService } from '@/modules/bitrix/modules/lead/services/lead.service';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import {
  B24LeadActiveStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/modules/lead/constants/lead.constants';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';

@Injectable()
export class BitrixTelphinEventsService {
  constructor(
    private readonly telphinService: TelphinService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixLeadService: BitrixLeadService,
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
      throw new BadRequestException(`Call hasn't flow in: ${callFlow}`);

    if (callStatus !== 'ANSWER')
      throw new BadRequestException(
        `Call has not status answer: [${callStatus}]`,
      );

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
    const { userId, phone } = fields;
    const batchCommands: B24BatchCommands = {};

    // Ищем лиды по номеру клиента
    const leadIds = await this.bitrixLeadService.getDuplicateLeadsByPhone(
      phone,
      true,
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
      const leadInfo = await this.bitrixLeadService.getLeadById(
        leadIds[0].toString(),
      );

      if (!leadInfo) throw new BadRequestException('Lead was not found');

      const { ID: leadId, STATUS_ID: leadStatusId } = leadInfo;

      switch (true) {
        case B24LeadNewStages.includes(leadStatusId): // Лид в новых стадиях
        case B24LeadRejectStages.includes(leadStatusId): // Лид в Неактивных стадиях
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
