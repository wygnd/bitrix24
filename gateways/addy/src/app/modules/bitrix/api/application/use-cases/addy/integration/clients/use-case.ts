import {
  ConflictException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IB24AddyIntegrationRegisterClientRequest } from '../../../../interfaces/addy/integration/clients/registration/requests/interface';
import { B24PORTS } from '../../../../../../constants/ports/constant';
import type { IB24Port } from '../../../../ports/port';
import { WinstonLogger } from '@shared/logger/winston.logger';
import { maybeCatchError } from '@shared/utils/catch-error';
import { TB24BatchCommands } from '../../../../../../interfaces/api/interface';
import dayjs from 'dayjs';
import { IB24AddyIntegrationRegisterClientResponse } from '../../../../interfaces/addy/integration/clients/registration/responses/interface';
import { IB24AddyIntegrationAddClientPaymentRequest } from '../../../../interfaces/addy/integration/clients/payments/requests/interface';
import type { IB24LeadsPort } from '../../../../ports/leads/port';
import { B24AddyPaymentMethods } from '../../../../constants/addy/integration/payments/constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { B24AddyClientsAddClientCommand } from '../../../../commands/addy/clients/add/command';
import { IB24AddyClientsContractAddRequest } from '../../../../interfaces/addy/integration/clients/contracts/add/requests/interface';
import { B24AddyClientUpdateClientCommand } from '../../../../commands/addy/clients/update/command';
import { B24AddyClientsGetClientsQuery } from '../../../../queries/addy/clients/query';
import { Op, WhereOptions } from 'sequelize';
import {
  IB24AddyClientBulkUpdate,
  IB24AddyClientEntity,
} from '../../../../interfaces/addy/integration/clients/entities/entity';
import { B24AddyClientsGetClientByEmailQuery } from '../../../../queries/addy/clients/get-client/by-email/query';
import { B24AddyClientBulkUpdateClientsCommand } from '../../../../commands/addy/clients/update/bulk/command';
import { IB24Lead } from '../../../../interfaces/leads/interface';
import { IB24AddyIntegrationAddClientSiteRequest } from '../../../../interfaces/addy/integration/clients/site/requests/interface';
import { IB24CRMDuplicateRequest } from '../../../../../../interfaces/api/requests/crm/duplicate/requests/interface';
import { TB24CRMDuplicateResponse } from '../../../../../../interfaces/api/requests/crm/duplicate/responses/interface';

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
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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
      const fullName = `${name} ${last_name}`;

      // 1. Ищем клиента в Битрикс24 по номеру или email
      // 2. Сохраняем в БД почту клиента
      const [
        {
          result: {
            result: { duplicatesByPhone, duplicatesByEmail },
          },
        },
      ] = await Promise.all([
        this.bitrixService.callBatch<{
          duplicatesByPhone: TB24CRMDuplicateResponse;
          duplicatesByEmail: TB24CRMDuplicateResponse;
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
        }),
        this.commandBus
          .execute(new B24AddyClientsAddClientCommand(email, fullName))
          .catch((err) => {
            // Если это не 409 (Клиент существует) логируем ошибку
            if (err instanceof ConflictException) {
              return;
            }

            this.logger.error({
              handler: this.handleEmitRegisterEvent.name,
              message: 'Ошибка при добавлении клиента в БД',
              request: data,
              error: maybeCatchError(err),
            });
          }),
      ]);

      const batchCommands: TB24BatchCommands = {};
      let leadId: number;

      switch (true) {
        // Если нашли по номеру
        case 'LEAD' in duplicatesByPhone && duplicatesByPhone.LEAD.length > 0:
          leadId = duplicatesByPhone.LEAD[0];
          break;

        // Если нашли по почте
        case 'LEAD' in duplicatesByEmail && duplicatesByEmail.LEAD.length > 0:
          leadId = duplicatesByEmail.LEAD[0];
          break;

        // Не нашли
        default:
          leadId = -1;
      }

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
              NAME: fullName, // Фио
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

      // Отправляем запрос в Битрикс24
      const response = await this.bitrixService.callBatch(batchCommands, true);

      // Логирование
      this.logger.debug({
        handler: this.handleEmitRegisterEvent.name,
        request: batchCommands,
        response: response,
      });

      return {
        status: true,
        message: 'Данные отправлены в Битрикс24',
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

      const batchCommands: TB24BatchCommands = {};
      const chatMessage: string[] = [
        payment_time,
        methodType,
        this.bitrixService.formatPrice(amount),
        user_email,
      ];

      if (leadIds.length > 0) {
        const lead = await this.leadsService.getLeadById(leadIds[0].toString());
        let additionalChatMessage: string;

        // Если не Иван Ильин
        if (lead && lead.assignedById !== 1) {
          additionalChatMessage = `[user=${lead.assignedById}][/user]`;
        } else {
          additionalChatMessage = 'Оплатил самостоятельно';
        }

        chatMessage.unshift(additionalChatMessage);

        const [leadId] = leadIds;
        const comment = [
          `[b]Новый платеж[/b] от ${payment_time}`,
          `[b]Тип платежа:[/b] ${methodType}`,
          `[b]Сумма[/b]: ${this.bitrixService.formatPrice(amount)}`,
          `[b]Сумма без комиссии[/b]: ${this.bitrixService.formatPrice(amount_without_commission)}`,
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
      } else {
        chatMessage.push('Оплатил самостоятельно');
      }

      batchCommands['sendMessage'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: 'chat104', // Addy pay
          MESSAGE: chatMessage.join(' | '),
        },
      };

      const response = await this.bitrixService.callBatch(batchCommands, true);

      this.logger.debug({
        handler: this.handleEmitClientAddPayment.name,
        request: data,
        response,
      });

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

  /**
   * Handle request from site
   *
   * ---
   *
   * Обработка заявки с сайта
   * @param data
   */
  public async handleEmitClientSiteRequest(
    data: IB24AddyIntegrationAddClientSiteRequest,
  ) {
    try {
      const { phone, name = '' } = data;
      const { result: responseFindLead } = await this.bitrixService.callMethod<
        IB24CRMDuplicateRequest,
        TB24CRMDuplicateResponse
      >('crm.duplicate.findbycomm', {
        type: 'EMAIL',
        values: [phone],
        entity_type: 'LEAD',
      });
      const assignedId = 26;
      let leadId: number;

      // Если не нашли
      if (Array.isArray(responseFindLead)) {
        const response = await this.leadsService.createLead({
          name: name,
          assignedById: assignedId,
          fm: [
            {
              valueType: 'WORK',
              value: phone,
              typeId: 'PHONE',
            },
          ],
        });

        if (!response)
          throw new UnprocessableEntityException(
            'Не удалось обработать заявку',
          );

        leadId = response.id;
      } else {
        leadId = responseFindLead.LEAD[0];
      }

      await this.bitrixService.callMethod('im.message.add', {
        DIALOG_ID: assignedId,
        MESSAGE:
          '[b]Заявка с сайта[/b][br]' +
          this.bitrixService.generateLeadUrl(leadId),
      });

      return {
        status: true,
        message: 'Заявка обработана',
      };
    } catch (error) {
      this.logger.error({
        handler: this.handleEmitClientSiteRequest.name,
        request: data,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Handle when client add contract in addy service
   *
   * ---
   *
   * Обработка, когда клиент создал договор в сервисе Addy
   * @param fields
   */
  public async handleEmitClientAddContract(
    fields: IB24AddyClientsContractAddRequest,
  ) {
    try {
      const { email, contract_number } = fields;
      const client = await this.queryBus.execute(
        new B24AddyClientsGetClientByEmailQuery(email),
      );

      const wasUpdated = await this.commandBus.execute(
        new B24AddyClientUpdateClientCommand(client.id, {
          hasFirstContract: true,
          checkIn: dayjs(client.createdAt)
            .add(14, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
        }),
      );

      const { result: lead } = await this.bitrixService.callMethod<
        object,
        TB24CRMDuplicateResponse
      >('crm.duplicate.findbycomm', {
        type: 'EMAIL',
        values: [email],
        entity_type: 'LEAD',
      });

      if (Array.isArray(lead))
        throw new UnprocessableEntityException('Клиент не найден');

      const {
        LEAD: [leadId],
      } = lead;

      this.bitrixService
        .callMethod('crm.timeline.comment.add', {
          fields: {
            ENTITY_ID: leadId,
            ENTITY_TYPE: 'lead',
            COMMENT: `Создан договор [b]${contract_number}[/b]`,
          },
        })
        .then((res) =>
          this.logger.debug({
            handler: this.handleEmitClientAddContract.name,
            request: { fields, wasUpdated },
            response: res,
          }),
        )
        .catch((err) =>
          this.logger.error({
            handler: this.handleEmitClientAddContract.name,
            request: { fields, wasUpdated },
            response: err,
          }),
        );

      return {
        status: true,
        message: 'Данные отправлены в Битрикс24',
      };
    } catch (error) {
      this.logger.error({
        handler: this.handleEmitClientAddContract.name,
        request: fields,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Search clients which hasn't contracts
   *
   * ---
   *
   * Поиск клиентов, у которых нет договоров
   * @param stage
   */
  public async handleFindClientsWithoutContracts(stage: number) {
    try {
      let whereOptions: WhereOptions<IB24AddyClientEntity>;

      // В зависимости от стадии определяем выборку
      switch (stage) {
        // Стадия 1: Если не было договора в течение 7 дней
        case 1:
          whereOptions = {
            wasHandled: false,
            hasFirstContract: false,
            createdAt: {
              [Op.gte]: dayjs().subtract(7, 'days').toISOString(),
            },
          };
          break;

        // Стадия 2: Если был создан договор в течение 14 дней
        case 2:
          whereOptions = {
            wasHandled: false,
            hasFirstContract: true,
            checkIn: {
              [Op.and]: [
                { [Op.ne]: null },
                { [Op.startsWith]: dayjs().format('YYYY-MM-DD') },
              ],
            },
          };
          break;

        default:
          throw new UnprocessableEntityException('Invalid stage');
      }

      const clients = await this.queryBus.execute(
        new B24AddyClientsGetClientsQuery({
          where: whereOptions,
          order: ['id'],
          attributes: ['id', 'email'],
        }),
      );

      if (clients.length === 0)
        throw new UnprocessableEntityException('No clients found');

      let batchCommands: TB24BatchCommands = {};

      clients.forEach(({ id, email }) => {
        batchCommands[`find_lead=${id}=${email}`] = {
          method: 'crm.duplicate.findbycomm',
          params: {
            type: 'EMAIL',
            values: [email],
            entity_type: 'LEAD',
          },
        };
      });

      const responses =
        await this.bitrixService.callBatches<
          Record<string, { LEAD: number[] } | []>
        >(batchCommands);

      const rowsNeedUpdate: IB24AddyClientBulkUpdate[] = [];
      batchCommands = {};

      Object.entries(responses).forEach(([key, value]) => {
        const [, client_id] = key.split('=');
        const clientId = parseInt(client_id);

        if (Array.isArray(value)) {
          rowsNeedUpdate.push({
            clientId: clientId,
            fields: {
              status: 'not_found_lead',
              wasHandled: true,
            },
          });
          return;
        }

        const [leadId] = value.LEAD;
        batchCommands[`get_lead=${clientId}=${leadId}`] = {
          method: 'crm.item.get',
          params: {
            entityTypeId: 1,
            id: leadId,
          },
        };
      });

      const responsesGetLeads =
        await this.bitrixService.callBatches<
          Record<string, { item: IB24Lead }>
        >(batchCommands);

      batchCommands = {};

      Object.entries(responsesGetLeads).forEach(([key, { item }]) => {
        const [, client_id, leadId] = key.split('=');
        const clientId = parseInt(client_id);

        // Если ответственный Матвей Ищеряков: выходим
        if (item.assignedById === 26) {
          rowsNeedUpdate.push({
            clientId,
            fields: {
              status: 'not_updated-same_assigned',
              wasHandled: true,
            },
          });
          return;
        }

        const assignedId = '16';

        batchCommands[`update_lead=${clientId}=${leadId}`] = {
          method: 'crm.item.update',
          params: {
            entityTypeId: 1,
            id: leadId,
            fields: {
              assignedById: assignedId,
            },
          },
        };

        batchCommands[`notify_manager=${clientId}`] = {
          method: 'im.message.add',
          params: {
            USER_ID: assignedId,
            MESSAGE:
              '[b]Вы назначены ответственным за лид[/b][br]' +
              this.bitrixService.generateLeadUrl(leadId),
          },
        };

        rowsNeedUpdate.push({
          clientId,
          fields: {
            status: 'handled',
            wasHandled: true,
          },
        });
      });

      const responseUpdateLeads =
        await this.bitrixService.callBatches(batchCommands);

      this.logger.debug({
        handler: this.handleFindClientsWithoutContracts.name,
        request: {
          stage,
          batchCommands,
        },
        response: responseUpdateLeads,
      });

      await this.commandBus.execute(
        new B24AddyClientBulkUpdateClientsCommand(rowsNeedUpdate),
      );

      return {
        status: true,
        message: 'Данные обработаны',
      };
    } catch (error) {
      this.logger.error({
        handler: this.handleFindClientsWithoutContracts.name,
        request: {
          stage,
        },
        error: maybeCatchError(error),
      });

      throw error;
    }
  }
}
