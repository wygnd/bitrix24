import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { B24WebhookHandleCallInitForSaleManagersOptions } from '@/modules/bitrix/application/interfaces/webhooks/webhook-voximplant-calls.interface';
import { TelphinService } from '@/modules/telphin/telphin.service';
import {
  AvitoPhoneList,
  Bitrix1CPhoneList,
  FLPhoneList,
  ProfiRUPhoneList,
} from '@/modules/bitrix/application/constants/avito/avito.constants';
import { TelphinExtensionItemExtraParams } from '@/modules/telphin/interfaces/telphin-extension.interface';
import {
  B24LeadConvertedStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/application/constants/leads/lead.constants';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import type { BitrixLeadsPort } from '@/modules/bitrix/application/ports/leads/leads.port';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixWidgetUseCase {
  private readonly logger = new WinstonLogger(
    BitrixWidgetUseCase.name,
    'bitrix:widgets'.split(':'),
  );

  constructor(
    private readonly telphinService: TelphinService,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(B24PORTS.LEADS.LEADS_DEFAULT)
    private readonly bitrixLeads: BitrixLeadsPort,
  ) {}

  /**
   * Получает данные по телефону о текущем звонке
   * @param phone
   */
  async getDataForCallOnBackgroundWorker(phone: string) {
    if (!phone) throw new BadRequestException('Invalid phone number');

    const clientPhone =
      phone[0] === '8'
        ? phone.replace('8', '+7')
        : !phone.includes('+')
          ? `+${phone}`
          : phone;

    // Получаем текущие звонки
    const currentCalls = await this.telphinService.getCurrentCalls();

    this.logger.debug({
      handler: this.getDataForCallOnBackgroundWorker.name,
      message: `Find phone: ${clientPhone} in current calls`,
      calls: currentCalls,
    });

    // Ищем текущий звонок по номеру телефона
    const targetCalls = currentCalls.filter(
      ({ call_flow, called_number, caller_id_name, caller_id_number }) =>
        call_flow === 'IN' &&
        [caller_id_name, caller_id_number, called_number].includes(clientPhone),
    );

    // Если не нашли текущий звонок по номеру клиента: выходим
    if (targetCalls.length === 0)
      throw new NotFoundException('Звонок не найден');

    // Получаем группу
    const [extensionGroup, extension] = await Promise.all([
      this.telphinService.getExtensionGroupById(
        targetCalls[0].called_extension.extension_group_id,
      ),
      this.telphinService.getClientExtensionById(
        targetCalls[0].called_extension.id,
      ),
    ]);

    this.logger.debug({
      handler: this.getDataForCallOnBackgroundWorker.name,
      message: 'check extension group',
      extensionGroup,
    });

    if (!extensionGroup)
      throw new NotFoundException('Группа внтуреннего номера не найдена');

    if (!extension) throw new NotFoundException('Внутренний номер не найден');

    // Вытаскиваем имя группы
    const { name: extensionGroupName } = extensionGroup;

    // Распределяем логику по отделам
    switch (true) {
      // Отдел продаж
      case /sale/gi.test(extensionGroupName):
        return this.handleGetDataForCallOnBackgroundWorker({
          phone: clientPhone,
          extension: extension,
          group: extensionGroup,
          calls: targetCalls,
          called_did: targetCalls[0].called_did,
        });

      default:
        return false;
    }
  }

  async handleGetDataForCallOnBackgroundWorker(
    fields: B24WebhookHandleCallInitForSaleManagersOptions,
  ) {
    const {
      phone: clientPhone,
      extension: {
        extra_params: extensionExtraParamsEncoded,
        ani: extensionPhone,
      },
      called_did: calledDid = '',
      calls,
      group: { id: extensionGroupId },
    } = fields;
    let returnedMessage = '';

    // Ищем лид по номеру телефона
    // Получаем список внутренних номеров все sale отделов
    const [leadIds, saleExtensionList] = await Promise.all([
      this.bitrixLeads.getDuplicateLeadsByPhone(clientPhone),
      this.telphinService.getExtensionGroupExtensionListByGroupIds([
        extensionGroupId,
      ]),
      calledDid && calledDid in Bitrix1CPhoneList
        ? this.bitrixService.callMethod('im.message.add', {
            DIALOG_ID: '114', // Дмитрий Андреев,
            MESSAGE: `Звонок по 1С с номера: [b]${clientPhone}[/b]`,
          })
        : null,
    ]);

    if (saleExtensionList.length === 0)
      throw new NotFoundException('Список внутренних номеров не найден');

    this.logger.debug({
      message: 'check extension phone and saleList from telphin',
      saleExtensionList,
      extensionPhone,
      leadIds,
    });

    if (calls.length === 0) {
      // Если клиент звонит напрямую

      // Так как клиент звонит напрямую,
      // то мы без проблем можем вытянуть user bitrix id
      // из поля [Комментарий] в телфине
      const extensionExtraParamsDecoded: TelphinExtensionItemExtraParams =
        JSON.parse(extensionExtraParamsEncoded);

      if (!extensionExtraParamsDecoded)
        throw new BadRequestException(
          `Ошибка получения bitrix_id из данных внутреннего номера: ${extensionPhone}`,
        );

      // Если лид не найден
      if (leadIds.length === 0) {
        // создаем лид
        returnedMessage =
          'Клиент звонит тебе. Лид не найден (Действующий с другого номера или по рекомендации)';
      } else {
        // Если лид найден
        const leadId = leadIds[0].toString();
        const lead = await this.bitrixLeads.getLeadById(leadId);

        if (!lead) throw new BadRequestException(`Лид [${leadId}] не найден`);

        const { STATUS_ID: leadStatusId } = lead;

        switch (true) {
          case B24LeadRejectStages.includes(leadStatusId):
            returnedMessage = 'Клиент в неактивной стадии Бери в работу себе';
            break;

          default:
            returnedMessage = 'Звонит твой клиент - отвечай';
            break;
        }
      }

      if (calledDid && calledDid in Bitrix1CPhoneList)
        returnedMessage = 'Звонок по 1С ' + returnedMessage;

      return {
        status: true,
        message: returnedMessage,
      };
    }

    let source: string;

    switch (true) {
      case calledDid && calledDid in AvitoPhoneList:
        source = ` с авито [${AvitoPhoneList[calledDid]}] `;
        break;

      case calledDid && calledDid in FLPhoneList:
        source = ` c FL [${FLPhoneList[calledDid]}] `;
        break;

      case calledDid && calledDid in ProfiRUPhoneList:
        source = ` с ПРОФИ.РУ [${ProfiRUPhoneList[calledDid]}] `;
        break;

      case calledDid && calledDid in Bitrix1CPhoneList:
        source = ` [${Bitrix1CPhoneList[calledDid]}] `;
        break;

      default:
        source = '';
        break;
    }

    if (leadIds.length === 0) {
      // Если лид не найден
      returnedMessage = `Новый лид ${source}. Бери в работу!`;
    } else {
      //   Если нашли лид

      // Получаем информацию о лиде
      const leadInfo = await this.bitrixLeads.getLeadById(
        leadIds[0].toString(),
      );

      if (!leadInfo)
        throw new NotFoundException(`Лид [${leadIds[0]}] не найден`);

      const { STATUS_ID: leadStatusId } = leadInfo;

      switch (true) {
        case B24LeadNewStages.includes(leadStatusId): // Лид в новых стадиях
          returnedMessage = `Новый лид${source}. Бери в работу!`;
          break;

        case B24LeadRejectStages.includes(leadStatusId): // Лид в неактивных стадиях
          returnedMessage = `Клиент${source}в неактивной стадии. Бери в работу себе`;
          break;

        case B24LeadConvertedStages.includes(leadStatusId): // Лид в завершаюих стадиях
          returnedMessage = `Ответь сразу! Действующий клиент звонит${source}. Скажи, что передашь обращение ответственному менеджеру/руководителю`;
          break;

        default:
          returnedMessage = `Ответь сразу! Клиент звонит ${source} повторно. Скажи, что передашь его обращение ответственному менеджеру`;
          break;
      }
    }

    return {
      status: true,
      message: returnedMessage,
    };
  }
}
