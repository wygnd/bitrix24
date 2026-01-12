import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { B24Emoji, B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import {
  B24ImbotRegisterCommand,
  B24ImbotSendMessageOptions,
  B24ImbotUpdateMessageOptions,
} from '@/modules/bitrix/application/interfaces/bot/imbot.interface';
import { OnImCommandKeyboardDto } from '@/modules/bitrix/application/dtos/bot/imbot-events.dto';
import {
  ImbotHandleApproveSiteForAdvert,
  ImbotHandleApproveSmmAdvertLayout,
  ImbotHandleDistributeNewDeal,
  ImbotHandleDistributeNewDealReject,
  ImbotHandleDistributeNewDealUnknown,
} from '@/modules/bitrix/application/interfaces/bot/imbot-handle.interface';
import { ImbotKeyboardApproveSiteForCase } from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-approve-site-for-case.interface';
import { ImbotApproveDistributeLeadFromAvitoByAi } from '@/modules/bitrix/application/interfaces/bot/imbot-approve-distribute-lead-from-avito-by-ai.interface';
import { ImbotKeyboardPaymentsNoticeWaiting } from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-payments-notice-waiting.interface';
import { B24ImboKeyboardAddyPaymentsApprove } from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-addy-payments-approve.interface';
import { B24EventParams } from '@/modules/bitrix/application/interfaces/bot/imbot-events.interface';
import { B24DepartmentTypeId } from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24_WIKI_PAYMENTS_ROLES_CHAT_IDS } from '@/modules/bitrix/application/constants/wiki/wiki-payments.constants';
import dayjs from 'dayjs';
import { WikiNotifyReceivePaymentOptions } from '@/modules/wiki/interfaces/wiki-notify-receive-payment';
import { BitrixDealsUseCase } from '@/modules/bitrix/application/use-cases/deals/deals.use-case';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';
import { BitrixTasksUseCase } from '@/modules/bitrix/application/use-cases/tasks/tasks.use-case';
import { BitrixDepartmentsUseCase } from '@/modules/bitrix/application/use-cases/departments/departments.use-case';
import { WikiService } from '@/modules/wiki/wiki.service';
import { AvitoService } from '@/modules/avito/avito.service';
import { BitrixAvitoUseCase } from '@/modules/bitrix/application/use-cases/avito/avito.use-case';

@Injectable()
export class BitrixBotUseCase {
  private readonly logger = new WinstonLogger(
    BitrixBotUseCase.name,
    'bitrix:bot'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BOT.BOT_DEFAULT)
    private readonly bitrixBot: BitrixBotPort,
    private readonly bitrixService: BitrixUseCase,
    private readonly bitrixDeals: BitrixDealsUseCase,
    private readonly bitrixTasks: BitrixTasksUseCase,
    private readonly bitrixDepartments: BitrixDepartmentsUseCase,
    private readonly wikiService: WikiService,
    private readonly avitoService: AvitoService,
    private readonly bitrixAvito: BitrixAvitoUseCase,
  ) {}

  async addCommand(fields: B24ImbotRegisterCommand) {
    return this.bitrixBot.addCommand(fields);
  }

  async getCommands() {
    return this.bitrixBot.getBotCommands();
  }

  async getCommandById(commandId: string) {
    return this.bitrixBot.getBotCommandById(commandId);
  }

  async sendMessage(fields: Omit<B24ImbotSendMessageOptions, 'BOT_ID'>) {
    return this.bitrixBot.sendMessage(fields);
  }

  async updateMessage(fields: Omit<B24ImbotUpdateMessageOptions, 'BOT_ID'>) {
    return this.bitrixBot.updateMessage(fields);
  }

  private limitAccessByPushButton(userId: string, userIds: string[]) {
    return this.bitrixBot.limitAccessByPushButton(userId, userIds);
  }

  encodeText(message: string) {
    return this.bitrixBot.encodeText(message);
  }

  decodeText(message: Buffer<ArrayBuffer>) {
    return this.bitrixBot.decodeText(message);
  }

  private getRandomDistributingMessage() {
    return this.bitrixBot.getRandomDistributingMessage();
  }

  async sendTestMessage(message: string) {
    return this.bitrixBot.sendTestMessage(message);
  }

  async getBotList() {
    return this.bitrixBot.getBotList();
  }

  /**
   * Global handle bot command and distribute by functions
   *
   * ---
   *
   * Глобальная обработка команд бота и распределение логики по функциям
   * @param body
   */
  async handleOnImCommandAdd(body: OnImCommandKeyboardDto) {
    try {
      this.logger.debug({ message: `New command handler`, body });
      const { event, data } = body;

      if (event !== 'ONIMCOMMANDADD')
        throw new ForbiddenException('Invalid event');

      const {
        MESSAGE,
        MESSAGE_ID,
        DIALOG_ID,
        FROM_USER_ID: pushButtonUserId,
      } = data.PARAMS;
      const [command, _] = MESSAGE.split(' ', 2);
      const commandParamsDecoded: unknown = JSON.parse(
        MESSAGE.replace(command, ''),
      );
      let response: Promise<unknown>;
      let status: boolean;

      switch (command) {
        case '/distributeNewDeal':
          response = this.handleDistributeNewDeal(
            commandParamsDecoded as ImbotHandleDistributeNewDealUnknown,
            data.PARAMS,
          );
          return true;

        case '/approveSmmAdvertLayouts':
          response = this.handleApproveSmmAdvertLayout(
            commandParamsDecoded as ImbotHandleApproveSmmAdvertLayout,
            MESSAGE_ID,
          );
          status = true;
          break;

        case '/approveSiteDealForAdvert':
          response = this.handleApproveSiteForAdvert(
            commandParamsDecoded as ImbotHandleApproveSiteForAdvert,
            MESSAGE_ID,
          );
          status = true;
          break;

        case '/approveSiteForCase':
          response = this.handleApproveSiteForCase(
            commandParamsDecoded as ImbotKeyboardApproveSiteForCase,
            MESSAGE_ID,
          );
          status = true;
          break;

        case '/approveDistributeDealFromAvitoByAI':
          response = this.handleApproveDistributeDealFromAvitoByAI(
            commandParamsDecoded as ImbotApproveDistributeLeadFromAvitoByAi,
            MESSAGE_ID,
          );
          status = true;
          break;

        case '/approveReceivedPayment':
          // Если нажал на кнопку кто-то, кроме:
          // Иван Ильин, Анастасия Самыловская, Grampus
          // Выходим
          if (
            this.limitAccessByPushButton(pushButtonUserId, [
              '27',
              '442',
              '460',
              '376',
            ])
          ) {
            response = Promise.resolve(
              `[${command}]: Forbidden push button ${pushButtonUserId}`,
            );
            status = false;
            break;
          }

          response = this.handleApprovePayment(
            commandParamsDecoded as ImbotKeyboardPaymentsNoticeWaiting,
            MESSAGE_ID,
            DIALOG_ID,
          );
          status = true;
          break;

        case '/approveAddyPaymentOnPay':
          if (
            this.limitAccessByPushButton(pushButtonUserId, ['27', '460', '376'])
          ) {
            response = Promise.resolve(
              `[${command}]: Forbidden push button ${pushButtonUserId}`,
            );
            status = false;
            break;
          }

          response = this.handleApproveAddyPaymentOnPay(
            commandParamsDecoded as B24ImboKeyboardAddyPaymentsApprove,
            MESSAGE_ID,
          );
          status = true;
          break;

        default:
          status = false;
          response = Promise.resolve('Not handled yet');
          break;
      }

      response
        .then((result) => {
          this.logger.debug({ message: 'Result handled button', result });
        })
        .catch((error) => {
          this.logger.error(error);
        });

      return status;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Handle button with command **distributeNewDeal**
   * Function update deals and send message in chat about distribute deals on target project-manager
   *
   * ---
   *
   * Обработка команды **distributeNewDeal**
   * Функция обновляет сделку, отправляет сообщение в чат о распределении сделки на указанного проект-менеджера
   * @param fields
   * @param params
   */
  async handleDistributeNewDeal(
    fields: ImbotHandleDistributeNewDealUnknown,
    params: B24EventParams,
  ) {
    const { handle } = fields;

    switch (handle) {
      case 'distributeDeal':
        return this.handleDistributeNewDealSuccess(
          fields as ImbotHandleDistributeNewDeal,
          params,
        );

      default:
        throw new BadRequestException(
          'This distribute handle type is not handling yet',
        );
    }
  }

  /**
   * Handling click button in distribution chats
   *
   * ---
   *
   * Обработка нажатия на кнопку в чатах 'Распределение...'
   * @param fields
   * @param params
   */
  async handleDistributeNewDealSuccess(
    fields: ImbotHandleDistributeNewDeal,
    params: B24EventParams,
  ) {
    try {
      const { dealId, department, chatId, managerId, stage, assignedFieldId } =
        fields;

      const { DIALOG_ID, MESSAGE_ID } = params;
      const deal = await this.bitrixDeals.getDealById(dealId, 'force');
      let nextStage = stage ?? '';

      if (!deal) return false;

      switch (department) {
        case B24DepartmentTypeId.SEO:
          if (!stage) break;

          switch (deal.CATEGORY_ID) {
            case '34':
              nextStage = 'C34:PREPAYMENT_INVOIC';
              break;

            case '7':
              nextStage = 'C7:NEW';
              break;

            case '16':
              nextStage = 'C16:NEW';
              break;
          }

          break;
      }

      const batchCommands: B24BatchCommands = {
        update_deal: {
          method: 'crm.deal.update',
          params: {
            id: dealId,
            fields: {
              [assignedFieldId]: managerId,
              STAGE_ID: nextStage,
            },
          },
        },
      };

      if (stage) {
        // Если Ответственный SEO специалист выбран
        // в сообщении его тоже указать надо
        const secondManager = deal['UF_CRM_1623766928']
          ? ` и [user=${deal['UF_CRM_1623766928']}][/user]`
          : '';

        // Отправляем в другой чат сообщение о распределенной сделке
        batchCommands['send_next_chat_message'] = {
          method: 'imbot.message.add',
          params: {
            BOT_ID: this.bitrixService.getConstant('BOT_ID'),
            DIALOG_ID: chatId,
            MESSAGE:
              'Распределение сделки ' +
              this.bitrixService.generateDealUrl(dealId, deal.TITLE) +
              ` на [user=${managerId}][/user]${secondManager}[br]` +
              this.getRandomDistributingMessage(),
          },
        };

        // Обновляем сообщение. Помечаем его как "Обработанное"
        batchCommands['update_old_message'] = {
          method: 'imbot.message.update',
          params: {
            BOT_ID: this.bitrixService.getConstant('BOT_ID'),
            MESSAGE_ID: MESSAGE_ID,
            DIALOG_ID: DIALOG_ID,
            MESSAGE:
              `[b]${B24Emoji.SUCCESS} Обработано[/b][br]` +
              `Сделка распределена на [user=${managerId}][/user]${secondManager}[br][br]` +
              this.bitrixService.generateDealUrl(dealId, deal.TITLE),
            KEYBOARD: '',
          },
        };
      }

      this.bitrixService.callBatch(batchCommands);
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * @deprecated
   * Handle ONLY ADVERT DEAL. If user click on 'Reject' button
   *
   * ---
   *
   * Обрабатывает ТОЛЬКО СДЕЛКИ НА РК. Если пользователь нажал кнопку 'Брак'
   * @param fields
   * @param params
   */
  async handleDistributeNewDealReject(
    fields: ImbotHandleDistributeNewDealReject,
    params: B24EventParams,
  ) {
    const { userId, userCounter, dealId, dealTitle } = fields;
    const { MESSAGE_ID, DIALOG_ID } = params;

    this.wikiService.sendRejectDistributeNewDeal({
      bitrix_id: userId,
      counter: userCounter,
    });

    this.bitrixService
      .callBatch<B24BatchResponseMap>({
        update_message: {
          method: 'imbot.message.update',
          params: {
            DIALOG_ID: DIALOG_ID,
            MESSAGE_ID: MESSAGE_ID,
            MESSAGE:
              '[b]Обработано: Брак[/b][br]' +
              this.bitrixService.generateDealUrl(dealId, dealTitle),
            KEYBOARD: '',
          },
        },
        update_deal: {
          method: 'crm.deal.update',
          params: {
            id: dealId,
            fields: {
              STAGE_ID: 'C1:14',
            },
          },
        },
      })
      .then(({ result }) => {
        if (Object.keys(result.result_error).length === 0) return;

        console.log(result.result_error);
      });

    return true;
  }

  /**
   * Handle button with **approveSmmAdvertLayouts** command.
   * Function send message to responsible and accomplices
   * and close and return task
   *
   * ---
   *
   * Обработка кнопки с командой **approveSmmAdvertLayouts**
   * Функция отправляет сообщение исполнителю и соисполнителям
   * и закрывает или возвращает задачу
   *
   * @param fields
   * @param messageId
   */
  async handleApproveSmmAdvertLayout(
    fields: ImbotHandleApproveSmmAdvertLayout,
    messageId: number,
  ) {
    try {
      const {
        taskId,
        isApproved,
        responsibleId,
        accomplices,
        message: oldMessage,
      } = fields;
      let message: string;
      let changeMessage: string;
      let batchCommandsSendMessage: B24BatchCommands = {};

      // Если согласованно
      if (isApproved) {
        batchCommandsSendMessage['set_complete_task'] = {
          method: 'tasks.task.approve',
          params: {
            taskId: taskId,
          },
        };
        message = 'Макет согласован. Задача завершена.[br]';
        changeMessage = '>>[b]Обарботанно: Макет согласован[/b][br][br]';
      } else {
        // Если не согласованно
        batchCommandsSendMessage['return_task'] = {
          method: 'tasks.task.disapprove',
          params: {
            taskId: taskId,
          },
        };

        message = 'Макет не согласован. Задача возвращена.[br]';
        changeMessage = '>>[b]Обарботанно: Макет не согласован[/b][br][br]';
      }

      message += this.bitrixService.generateTaskUrl(responsibleId, taskId);

      batchCommandsSendMessage['update_old_message'] = {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.bitrixService.getConstant('BOT_ID'),
          MESSAGE_ID: messageId,
          MESSAGE: changeMessage + this.decodeText(oldMessage),
          KEYBOARD: '',
        },
      };
      batchCommandsSendMessage['send_message_to_responsible'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: responsibleId,
          MESSAGE: message,
        },
      };

      if (accomplices.length > 0) {
        accomplices.forEach((userId) => {
          batchCommandsSendMessage[`send_message_to_accomplices_${userId}`] = {
            method: 'im.message.add',
            params: {
              DIALOG_ID: userId,
              MESSAGE: message,
            },
          };
        });
      }

      this.bitrixService.callBatch(batchCommandsSendMessage);
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Handle button with **approveSiteDealForAdvert** command.
   * Function update existsing message and send messages to project manager and
   * his supervisor
   *
   * ---
   * Обработка кнопки с коммандой **approveSiteDealForAdvert**.
   * Функция обновляет старое сообщение и отправляет сообщения проект-менеджеру и
   * его руководителю.
   *
   * @param dealId
   * @param isApprove
   * @param managerId
   * @param messageId
   */
  async handleApproveSiteForAdvert(
    { dealId, isApprove, managerId }: ImbotHandleApproveSiteForAdvert,
    messageId: number,
  ) {
    try {
      let managerMessage = isApprove
        ? 'Ваш проект [u]согласован[/u] отделом рекламы[br]' +
          this.bitrixService.generateDealUrl(dealId) +
          '[br][br]После перевода сделки в стадию [b]Сделка успешна[/b], ' +
          'Вам необходимо зайти в сделку РК и отправить её в распределение.'
        : 'Ваш проект [u]НЕ согласован[/u] отделом рекламы.[br]' +
          this.bitrixService.generateDealUrl(dealId) +
          '[br][br]После выполнения всех пунктов по правкам и готовности сайта, переводите сделку в стадию [b]Сделка успешна[/b]' +
          ' и заходите в сделку РК и отправляйте её в распределение.';

      let changeMessage =
        '[b]Сообщение обработано: ' +
        (isApprove ? 'Сайт согласован' : 'Сайт не согласован') +
        `[/b][br][br]` +
        this.bitrixService.generateDealUrl(dealId);

      const siteDepartmentHeadId =
        (await this.bitrixDepartments.getDepartmentById(['98']))[0].UF_HEAD ??
        '';

      this.bitrixService.callBatch({
        send_message_head_sites_category: {
          method: 'im.message.add',
          params: {
            DIALOG_ID: siteDepartmentHeadId,
            MESSAGE: managerMessage,
            SYSTEM: 'Y',
          },
        },
        send_message_manager_deal: {
          method: 'im.message.add',
          params: {
            DIALOG_ID: managerId,
            MESSAGE: managerMessage,
            SYSTEM: 'Y',
          },
        },
        update_message: {
          method: 'imbot.message.update',
          params: {
            BOT_ID: this.bitrixService.getConstant('BOT_ID'),
            MESSAGE_ID: messageId,
            MESSAGE: changeMessage,
            KEYBOARD: '',
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Handle button with commnad **approveSiteForCase**
   * Function update project manager message set was handling in deals
   * and send message Irina Navolockaya if site is approve
   *
   * ---
   *
   * Обработка нажатия кнопки с командой **approveSiteForCase**
   * Функция обновляет сообщение у проект-менеджера, устанавливает значение в карточке сделки
   * и если сайт согласован отправляет сообщение Ирине Наволоцкой
   * @param dealId
   * @param approved
   * @param oldMessage
   * @param messageId
   */
  async handleApproveSiteForCase(
    { dealId, approved, oldMessage }: ImbotKeyboardApproveSiteForCase,
    messageId: number,
  ) {
    try {
      const batchCommands: B24BatchCommands = {
        update_message: {
          method: 'imbot.message.update',
          params: {
            BOT_ID: this.bitrixService.getConstant('BOT_ID'),
            MESSAGE_ID: messageId,
            MESSAGE:
              `[b]Обработано: ${approved ? 'Сайт подходит' : 'Сайт не подходит'}[/b][br][br]` +
              this.decodeText(oldMessage),
            KEYBOARD: '',
          },
        },
        update_deal: {
          method: 'crm.deal.update',
          params: {
            id: dealId,
            fields: {
              UF_CRM_1760972834021: '1', // Поле: Обработка кейса
            },
          },
        },
      };

      if (approved) {
        batchCommands['send_message'] = {
          method: 'imbot.message.add',
          params: {
            BOT_ID: this.bitrixService.getConstant('BOT_ID'),
            DIALOG_ID: this.bitrixService.getConstant('ADDY').casesChatId, // Чат для кейсов,
            MESSAGE:
              'Этот сайт соответствует требованиям для кейса[br]Сделка: ' +
              this.bitrixService.generateDealUrl(dealId),
          },
        };
      }

      this.bitrixService.callBatch(batchCommands);
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  async handleApproveDistributeDealFromAvitoByAI(
    {
      fields,
      approved,
      message,
      phone,
    }: ImbotApproveDistributeLeadFromAvitoByAi,
    messageId: number,
  ) {
    this.updateMessage({
      MESSAGE_ID: messageId,
      MESSAGE:
        `[b]Обработано: ${approved ? 'лид создан' : 'лид отменен'}[/b][br][br]` +
        this.decodeText(message),
      KEYBOARD: '',
    });

    if (!approved) {
      this.avitoService
        .rejectDistributeLeadByAi(phone)
        .then((response) => {
          this.logger.debug({
            message: 'Check respose from avito on reject distributed ai lead',
            data: response,
          });
        })
        .catch((err) => {
          this.logger.error({
            message:
              'Error on send reject distribute lead by AI to avito service',
            error: err,
          });
        });
      return false;
    }

    this.bitrixAvito.distributeClientRequestFromAvito(fields);
    return true;
  }

  /**
   * Handle command **approveReceivedPayment**:
   * update and send new message in G-pay chat
   *
   * ---
   *
   * Обработка команды **approveReceivedPayment**:
   * обновляет сообщение и отправляет новое в G-pay chat
   * @param fields
   * @param messageId
   * @param dialogId
   */
  public async handleApprovePayment(
    fields: ImbotKeyboardPaymentsNoticeWaiting,
    messageId: number,
    dialogId: string,
  ) {
    const { message, dialogId: toChatId } = fields;
    const messageDecoded = this.decodeText(message);

    // Обновляем сообщение и отправляем новое о том, что платеж поступил
    this.bitrixService.callBatch({
      update_message: {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.bitrixService.getConstant('BOT_ID'),
          MESSAGE_ID: messageId,
          MESSAGE: messageDecoded,
          KEYBOARD: '',
        },
      },
      send_new_message: {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixService.getConstant('BOT_ID'),
          DIALOG_ID: dialogId,
          MESSAGE: messageDecoded + '[br][br][b]ПЛАТЕЖ ПОСТУПИЛ[/b]',
        },
      },
    });

    switch (toChatId) {
      // Чат: Отдел контекстной рекламы
      case B24_WIKI_PAYMENTS_ROLES_CHAT_IDS.ad_specialist:
        return this.handleApprovePaymentAdvert(fields, messageDecoded);

      // Остальные чаты
      default:
        return this.handleApprovePaymentDefault(fields, messageDecoded);
    }
  }

  /**
   * Handle approve payment for advert department
   *
   * ---
   *
   * Обработка платежа для рекламы
   * @private
   */
  private async handleApprovePaymentAdvert(
    fields: ImbotKeyboardPaymentsNoticeWaiting,
    message: string,
  ) {
    try {
      const { isBudget, dealId, userId } = fields;
      const dealFields = await this.bitrixDeals.getDealById(dealId);

      if (!dealFields)
        throw new NotFoundException(`Deal was not found: ${dealId}`);

      /**
       * UF_CRM_1638351463: Поле "Кто ведет"
       */
      const { UF_CRM_1638351463: dealAdvertResponsibleId } = dealFields;
      const [userName, action, price, contract, organization] =
        message.split(' | ');
      const clearContract = this.bitrixService.clearBBCode(contract);
      const paymentType = /сбп/gi.test(organization) ? 'СБП' : 'РС';
      const createTaskFields = {
        TITLE: `TEST ${isBudget ? 'Пополнить бюджет НДС' : 'Оплата НДС'}`,
        CREATED_BY: dealAdvertResponsibleId,
        DESCRIPTION:
          `${isBudget ? '[b]Прикрепи выставленный счет из Яндекс и более ничего по задаче делать не нужно.[/b]' : ''}\n` +
          `[list=1]\n[*]${clearContract}[*]${price}[*]${paymentType}\n[/list]\n\n` +
          'Перейдите по ссылке и заполните поля:\n' +
          '[list]\n[*]Счет из Яндекса[*]Загрузить документ сам счет\n[/list]\n\n' +
          `https://wiki.grampus-studio.ru/lk/?screen=send-budget&deal_number=${clearContract}&amount=${this.bitrixService.clearNumber(price)}&type=${paymentType}`,
        RESPONSIBLE_ID: '444', // Екатерина Огрохина
        DEADLINE: dayjs().format('YYYY-MM-DD') + 'T18:00:00',
        ACCOMPLICES: ['216'], // Анна Теленкова
        UF_CRM_TASK: ['D_' + dealId],
      };

      if (/ндсип1/gi.test(message)) {
        createTaskFields.TITLE =
          'TEST ' + (isBudget ? 'Пополнить бюджет НДСИП1' : 'Оплата');
        createTaskFields.RESPONSIBLE_ID = '560'; // Любовь Боровикова
        createTaskFields.DESCRIPTION = '';
      }

      const task = await this.bitrixTasks.createTask(createTaskFields);

      if (!task)
        return {
          status: false,
          message: 'Invalid handle command: execute error on creating task',
        };

      const { id: taskId, responsibleId: taskResponsibleId } = task;

      const batchCommands: B24BatchCommands = {
        notify_about_new_task: {
          method: 'im.message.add',
          params: {
            DIALOG_ID: dealAdvertResponsibleId,
            MESSAGE:
              'TEST[br]' +
              `${
                isBudget
                  ? 'Поступила оплата за рекламный бюджет.[br]'
                  : 'Поступила оплата за ведение/допродажу.[br]'
              } Нужно выставить счет из Яндекс.Директ и прикрепить к этой задаче.[br]` +
              this.bitrixService.generateTaskUrl(
                createTaskFields.RESPONSIBLE_ID,
                taskId,
              ),
          },
        },
        send_message_to_head: {
          method: 'im.message.add',
          params: {
            DIALOG_ID: taskResponsibleId,
            MESSAGE:
              'TEST[br]' + isBudget
                ? 'Необходимо занести рекламный бюджет.[br]' +
                  this.bitrixService.generateTaskUrl(userId, taskId)
                : `Поступила оплата за ведение/допродажу.[br]Нужно внести в табель![br]${userName} | ${contract} | ${price} | месяц ведения: ${action}`,
          },
        },
      };

      return this.bitrixService.callBatch(batchCommands);
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Default handle approve payment
   *
   * ---
   *
   * Стандартный обработчик команды платежа
   * @private
   */
  private async handleApprovePaymentDefault(
    fields: ImbotKeyboardPaymentsNoticeWaiting,
    message: string,
  ) {
    try {
      // Декодируем сообщение
      // Получаем руководителя менеджера
      const batchCommands: B24BatchCommands = {
        get_user: {
          method: 'user.get',
          params: {
            filter: {
              ID: fields.userId,
            },
          },
        },
        get_user_department: {
          method: 'department.get',
          params: {
            ID: `$result[get_user][0][UF_DEPARTMENT][0]`,
          },
        },
      };

      /**
       * Виталий Баймурзаев - userName
       * Ожидание; Продление хостинга; Продление домена - action
       * Общая сумма: 6400 - price
       * 6462 - contract
       * АО "АГРОСКОН-ЖБИ" - organization
       * Продление доменного имени на 1 год и Размещение сайта на хостинге на 1 год #id:11779# - direction
       * 3525418065 - inn
       * unknown
       * date
       */
      const [
        userName,
        action,
        price,
        contract,
        organization,
        direction,
        inn,
        ,
        date,
      ] = message.split(' | ');

      // Собираем запрос для отправки сообщения руководителю
      batchCommands['send_message_head'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: '$result[get_user_department][0][UF_HEAD]',
          MESSAGE: `[b]TEST[/b][br][br]Поступила оплата за ведение/допродажу.[br]Нужно внести в табель![br]${userName} | ${contract} | ${price} | ${action}`,
        },
      };

      // Собираем объект для отправки в old wiki
      const data: WikiNotifyReceivePaymentOptions = {
        action: 'gft_log_user_money',
        money: this.bitrixService.clearNumber(price),
        deal_number: this.bitrixService.clearBBCode(contract),
        bitrix_user_id: fields.userId,
        user_name: this.bitrixService.clearBBCode(userName),
        direction: direction ? direction.replaceAll(/\|/gi, '').trim() : '',
        INN: inn.replaceAll(/\|/gi, ''),
        budget: fields.isBudget,
        payment_type: /сбп/gi.test(organization) ? 'СБП' : 'РС',
        date: date ? date.replaceAll(/([\[\]\/b])/gi, '') : '',
      };

      this.logger.debug({ data, batchCommands });

      // Отправляем данные
      return Promise.all([
        this.bitrixService.callBatch(batchCommands),
        // this.wikiService.notifyWikiAboutReceivePayment(data),
        this.sendTestMessage(
          `[b]Обработка кнопки принятия платежа[/b][br]${JSON.stringify({ batchCommands, data })}`,
        ),
      ]);
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  private async handleApproveAddyPaymentOnPay(
    fields: B24ImboKeyboardAddyPaymentsApprove,
    messageId: number,
  ) {
    const { message } = fields;
    this.updateMessage({
      MESSAGE_ID: messageId,
      MESSAGE: this.decodeText(message),
      KEYBOARD: '',
    });
  }
}
