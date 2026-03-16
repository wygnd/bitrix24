import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IB24AddyIntegrationRegisterClientRequest } from '../../../interfaces/addy/integration/clients/registration/requests/interface';
import { B24PORTS } from '../../../../constants/ports/constant';
import type { IB24Port } from '../../../ports/port';
import { WinstonLogger } from '@shared/logger/winston.logger';
import { maybeCatchError } from '@shared/utils/catch-error';
import { TB24BatchCommands } from '../../../../../interfaces/api/interface';
import dayjs from 'dayjs';
import { IB24AddyIntegrationRegisterClientResponse } from '../../../interfaces/addy/integration/clients/registration/responses/interface';
import { IB24AddyIntegrationAddClientPaymentRequest } from '../../../interfaces/addy/integration/clients/payments/requests/interface';
import type { IB24LeadsPort } from '../../../ports/leads/port';
import { B24AddyPaymentMethods } from '../../../constants/addy/integration/payments/constants';

@Injectable()
export class B24AddyIntegrationUseCase {
  private readonly logger = new WinstonLogger(
    B24AddyIntegrationUseCase.name,
    'bitrix/addy/integration',
  );

  constructor(
    @Inject(B24PORTS.BITRIX_DEFAULT) private readonly bitrixService: IB24Port,
    @Inject(B24PORTS.LEADS.LEADS_DEFAULT)
    private readonly leadsService: IB24LeadsPort,
  ) {}

  /**
   * Handle client register in Addy service
   *
   * ---
   *
   * Обработка регистрации клиента в сервисе Addy
   * @param data
   */
  public async handleEmitRegisterEvent(
    data: IB24AddyIntegrationRegisterClientRequest,
  ): Promise<IB24AddyIntegrationRegisterClientResponse> {
    try {
      const { phone, email, name, last_name, user_id } = data;

      const {
        result: {
          result: { duplicatesByPhone, duplicatesByEmail },
        },
      } = await this.bitrixService.callBatch<{
        duplicatesByPhone: { LEAD: number[] };
        duplicatesByEmail: { LEAD: number[] };
      }>({
        duplicatesByPhone: {
          method: 'crm.duplicate.findbycomm',
          params: {
            type: 'PHONE',
            values: [phone],
            entity_type: 'LEAD',
          },
        },
        duplicatesByEmail: {
          method: 'crm.duplicate.findbycomm',
          params: {
            type: 'EMAIL',
            values: [email],
            entity_type: 'LEAD',
          },
        },
      });
      let leadId: number;

      switch (true) {
        case 'LEAD' in duplicatesByPhone && duplicatesByPhone.LEAD.length > 0:
          leadId = duplicatesByPhone.LEAD[0];
          break;

        case 'LEAD' in duplicatesByEmail && duplicatesByEmail.LEAD.length > 0:
          leadId = duplicatesByEmail.LEAD[0];
          break;

        default:
          leadId = -1;
      }

      const batchCommands: TB24BatchCommands = {};

      if (leadId === -1) {
        // Создаем лид если не нашли его
        batchCommands['createLead'] = {
          method: 'crm.item.add',
          params: {
            entityTypeId: '1',
            fields: {
              ufCrm_1773150541796: '50', // Источник лида: Регистрация
              ufCrm_1773150315164: user_id, // ID
              ufCrm_1773150333884: email, // Логин пользователя (почта)
              ufCrm_1773387577463: dayjs().format('YYYY-MM-DD HH:mm:ss'), // Дата регистрации
              NAME: `${name} ${last_name}`, // Фио
              assignedById: '1', // Ответственный: Иван Ильин
              fm: [
                {
                  valueType: 'WORK',
                  value: phone,
                  typeId: 'PHONE',
                },
                {
                  valueType: 'WORK',
                  value: email,
                  typeId: 'EMAIL',
                },
              ],
            },
          },
        };
      } else {
        // Если нашли: добавляем комментарий
        const comment = [
          `[b]Регистрация в сервисе Addy[/b]`,
          `[b]Дата:[/b] ${dayjs().format('DD.MM.YYYY HH:mm:ss')}`,
          `[b]ФИО:[/b] ${name} ${last_name}`,
          `[b]Номер телефона:[/b] ${phone}`,
          `[b]Почта:[/b] ${email}`,
          `[b]ID:[/b] ${user_id}`,
        ];

        batchCommands['addComment'] = {
          method: 'crm.timeline.comment.add',
          params: {
            fields: {
              ENTITY_ID: leadId,
              ENTITY_TYPE: 'lead',
              COMMENT: comment.join('\n'),
            },
          },
        };
      }

      const response = await this.bitrixService.callBatch(batchCommands, true);

      this.logger.debug({
        handler: this.handleEmitRegisterEvent.name,
        request: batchCommands,
        response: response,
      });

      return {
        status: true,
        message: 'Отправлен в Битрикс24',
      };
    } catch (error) {
      this.logger.error({
        handler: this.handleEmitRegisterEvent.name,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Handle client send payment
   *
   * ---
   *
   * Обработка оплаты клиента
   */
  public async handleEmitClientAddPayment(
    data: IB24AddyIntegrationAddClientPaymentRequest,
  ) {
    try {
      const {
        user_email,
        method_type,
        payment_time,
        amount_without_commission,
        amount,
      } = data;
      const methodType =
        method_type in B24AddyPaymentMethods
          ? B24AddyPaymentMethods[method_type]
          : 'Не определен';

      const leadIds = await this.leadsService.getDuplicateLeads(
        'email',
        user_email,
      );

      if (leadIds.length === 0) throw new NotFoundException('Клиент не найден');

      const [leadId] = leadIds;

      const comment = [
        `[b]Новый платеж[/b] от ${payment_time}`,
        `[b]Тип платежа:[/b] ${methodType}`,
        `[b]Сумма[/b]: ${this.bitrixService.formatPrice(amount)}`,
        `[b]Сумма без комиссии[/b]: ${this.bitrixService.formatPrice(amount_without_commission)}`,
      ];

      const response = await this.bitrixService.callMethod(
        'crm.timeline.comment.add',
        {
          fields: {
            ENTITY_ID: leadId,
            ENTITY_TYPE: 'lead',
            COMMENT: comment.join('\n'),
          },
        },
      );

      this.logger.debug({
        handler: this.handleEmitClientAddPayment.name,
        request: data,
        response,
      });

      if (!response.result)
        throw new UnprocessableEntityException(
          'Ошибка отправки данных в Битрикс24',
        );

      return { status: true, message: 'Данные отправлены в Битрикс24' };
    } catch (error) {
      console.log(error);
      this.logger.error({
        handler: this.handleEmitClientAddPayment.name,
        request: data,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }
}
