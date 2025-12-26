import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
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

@Injectable()
export class BitrixTelphinEventsService {
  private readonly logger = new WinstonLogger(
    BitrixTelphinEventsService.name,
    'bitrix:services:integration:telphin:events'.split(':'),
  );

  constructor(
    private readonly telphinService: TelphinService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixLeadService: BitrixLeadService,
  ) {}

  async handleAnswerCall(fields: BitrixEventsAnswerOptions) {
    const {
      CalledExtensionID: extensionId,
      CallerIDNum: clientPhone,
      CallStatus: callStatus,
      CalledDID: calledDid,
    } = fields;

    if (callStatus !== 'ANSWER')
      throw new BadRequestException(
        `Call has not status answer: [${callStatus}]`,
      );

    // Получаем информацию о внутреннем номере
    const extensionData =
      await this.telphinService.getClientExtensionById(extensionId);

    if (!extensionData)
      throw new NotFoundException(`Extension was not found: ${extensionId}`);

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
    if (!extensionExtraParamsParsed.comment)
      throw new BadRequestException('Extension has not userId');

    // Получаем группу внутреннего номера
    const extensionGroupData =
      await this.telphinService.getExtensionGroupById(extensionGroupId);

    if (!extensionGroupData)
      throw new NotFoundException(
        `Extension group was not found: ${extensionGroupId}`,
      );

    this.logger.debug(
      {
        message: 'CHECK ANSWER CALL DATA',
        phone: clientPhone,
        userId: extensionExtraParamsParsed.comment,
        calledDid: calledDid,
      },
      'log',
    );

    return {
      message: 'Tested',
      status: true,
    };

    // Распределяем в зависимости от группы
    // switch (true) {
    //   case /sale/gi.test(extensionData.name):
    //     return this.handleAnswerCallForSaleDepartment({
    //       phone: clientPhone,
    //       userId: extensionExtraParamsParsed.comment,
    //       calledDid: calledDid,
    //     });
    //
    //   default:
    //     return {
    //       status: false,
    //       message: 'Not handled yet on call start',
    //     };
    // }
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
    let response: any;

    if (!phone) throw new BadRequestException('Invalid phone');

    const leadIds = await this.bitrixLeadService.getDuplicateLeadsByPhone(
      phone,
      true,
    );

    if (calledDid && calledDid in this.bitrixService.AVITO_PHONES) {
      // Если клиент звонит на авито номер

      if (leadIds.length === 0) {
        response = await this.bitrixLeadService.createLead({
          ASSIGNED_BY_ID: userId,
          STATUS_ID: B24LeadActiveStages[0], // Новый в работе
          PHONE: [
            {
              VALUE: phone,
              VALUE_TYPE: 'WORK',
            },
          ],
        });
      } else {
        const leadInfo = await this.bitrixLeadService.getLeadById(
          leadIds[0].toString(),
        );

        if (!leadInfo) throw new BadRequestException('Lead was not found');

        const { ID: leadId, STATUS_ID: leadStatusId } = leadInfo;

        switch (true) {
          case B24LeadNewStages.includes(leadStatusId): // Лид в новых стадиях
          case B24LeadRejectStages.includes(leadStatusId): // Лид в Неактивных стадиях
            response = this.bitrixLeadService.updateLead({
              id: leadId,
              fields: {
                ASSIGNED_BY_ID: userId,
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
              },
            });
            break;
        }
      }
    } else {
      // Если клиент звонит напрямую менеджеру

      if (leadIds.length === 0) {
        // Если лида по номеру не найдено

        // Создаем лид
        response = await this.bitrixLeadService.createLead({
          ASSIGNED_BY_ID: userId,
          STATUS_ID: B24LeadActiveStages[0], // Новый в работе,
          PHONE: [
            {
              VALUE: phone,
              VALUE_TYPE: 'WORK',
            },
          ],
        });
      } else {
        const leadId = leadIds[0].toString();
        const lead = await this.bitrixLeadService.getLeadById(leadId);

        if (!lead) throw new BadRequestException('Lead was not found');

        const { STATUS_ID: leadStatusId } = lead;

        switch (true) {
          case B24LeadRejectStages.includes(leadStatusId):
            response = await this.bitrixLeadService.updateLead({
              id: leadId,
              fields: {
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
                ASSIGNED_BY_ID: userId,
              },
            });
            break;
        }
      }
    }

    // this.logger.debug(response, 'log');

    return {
      status: true,
      message: 'Successfully handled start call',
      response: response,
    };
  }
}
