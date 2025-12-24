import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { ImbotUnregisterCommandDto } from './dtos/imbot-unregister-command.dto';
import {
  B24ImbotRegisterCommand,
  B24ImbotRegisterOptions,
  B24ImbotSendMessageOptions,
  B24ImbotUnRegisterOptions,
  B24ImbotUpdateMessageOptions,
} from './imbot.interface';
import { OnImCommandKeyboardDto } from '@/modules/bitrix/modules/imbot/dtos/imbot-events.dto';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ConfigService } from '@nestjs/config';
import { BitrixConstants } from '@/common/interfaces/bitrix-config.interface';
import { ImbotBot } from '@/modules/bitrix/modules/imbot/interfaces/imbot-bot.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { ImbotCommand } from '@/modules/bitrix/modules/imbot/interfaces/imbot.interface';
import {
  ImbotHandleApproveSiteForAdvert,
  ImbotHandleApproveSmmAdvertLayout,
  ImbotHandleDistributeNewDeal,
  ImbotHandleDistributeNewDealReject,
  ImbotHandleDistributeNewDealUnknown,
} from '@/modules/bitrix/modules/imbot/interfaces/imbot-handle.interface';
import { WikiService } from '@/modules/wiki/wiki.service';
import { B24EventParams } from '@/modules/bitrix/modules/imbot/interfaces/imbot-events.interface';
import { B24DepartmentTypeId } from '@/modules/bitrix/modules/department/department.interface';
import { BitrixDealService } from '@/modules/bitrix/modules/deal/deal.service';
import { BitrixDepartmentService } from '@/modules/bitrix/modules/department/department.service';
import { B24Emoji } from '@/modules/bitrix/bitrix.constants';
import { ImbotKeyboardApproveSiteForCase } from '@/modules/bitrix/modules/imbot/interfaces/imbot-keyboard-approve-site-for-case.interface';
import { ImbotApproveDistributeLeadFromAvitoByAi } from '@/modules/bitrix/modules/imbot/interfaces/imbot-approve-distribute-lead-from-avito-by-ai.interface';
import { BitrixIntegrationAvitoService } from '@/modules/bitrix/modules/integration/avito/avito.service';
import { ImbotKeyboardPaymentsNoticeWaiting } from '@/modules/bitrix/modules/imbot/interfaces/imbot-keyboard-payments-notice-waiting.interface';
import { AvitoService } from '@/modules/avito/avito.service';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixImBotService {
  private readonly logger = new WinstonLogger(
    BitrixImBotService.name,
    'bitrix:services'.split(':'),
  );
  private readonly botId: string;
  private readonly distributeDealMessages: string[];

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly wikiService: WikiService,
    private readonly dealService: BitrixDealService,
    private readonly departmentService: BitrixDepartmentService,
    @Inject(forwardRef(() => BitrixIntegrationAvitoService))
    private readonly avitoIntegrationService: BitrixIntegrationAvitoService,
    private readonly avitoService: AvitoService,
  ) {
    const bitrixConstants =
      this.configService.get<BitrixConstants>('bitrixConstants');

    if (!bitrixConstants)
      throw new Error('BITRIX BOT MODULE: Invalid config constants');

    const { BOT_ID } = bitrixConstants;

    this.botId = BOT_ID;
    this.distributeDealMessages = [
      'Желаю максимально легкого клиента 😊',
      'Удачного проекта, будь креативным и сильным 💪🏼',
      'Бери в работу, скорее звони клиенту ⚡',
      'Take it! Hold it! love it! 🔥',
    ];
  }

  /**
   * Add new bot command
   *
   * ---
   *
   * Регистрация новой команды
   * see: https://apidocs.bitrix24.ru/api-reference/chat-bots/commands/imbot-command-register.html
   * @param fields
   */
  async addCommand(fields: B24ImbotRegisterCommand) {
    const commandLanguage = fields.LANG.find((l) => l.LANGUAGE_ID === 'ru');

    if (!commandLanguage) throw new BadRequestException('Invalid language');

    const { result: commandId } = await this.bitrixService.callMethod<
      B24ImbotRegisterCommand,
      number
    >('imbot.command.register', {
      ...fields,
    });

    if (!commandId) throw new BadRequestException('Error on add command');

    let commandsFromCache = await this.redisService.get<ImbotCommand[]>(
      REDIS_KEYS.BITRIX_DATA_BOT_COMMANDS,
    );

    const newCommand: ImbotCommand = {
      id: `${commandId}`,
      command: fields.COMMAND,
      name: commandLanguage.TITLE,
    };

    if (!commandsFromCache) commandsFromCache = [];

    commandsFromCache.push(newCommand);

    this.redisService.set<ImbotCommand[]>(
      REDIS_KEYS.BITRIX_DATA_BOT_COMMANDS,
      commandsFromCache,
    );

    return commandId;
  }

  /**
   * Get bot command list
   *
   * ---
   *
   * Получение списка команд бота
   */
  async getBotCommands() {
    const commands = await this.redisService.get<ImbotCommand[]>(
      REDIS_KEYS.BITRIX_DATA_BOT_COMMANDS,
    );

    return commands ? commands : [];
  }

  async getBotCommandById(commandId: string) {
    const commands = await this.redisService.get<ImbotCommand[]>(
      REDIS_KEYS.BITRIX_DATA_BOT_COMMANDS,
    );
    const command = commands?.find((c) => c.id === commandId);

    if (!commands || !command) throw new NotFoundException('Command not found');

    return command;
  }

  /**
   * Remove bot command
   * see: https://apidocs.bitrix24.ru/api-reference/chat-bots/commands/imbot-command-unregister.html
   * @param fields
   */
  private async removeCommand(fields: ImbotUnregisterCommandDto) {
    return await this.bitrixService.callMethod<
      ImbotUnregisterCommandDto,
      boolean
    >('imbot.command.unregister', fields);
  }

  /**
   * Send message in chat via bot
   * @param fields
   */
  async sendMessage(fields: Omit<B24ImbotSendMessageOptions, 'BOT_ID'>) {
    return this.bitrixService.callMethod<B24ImbotSendMessageOptions, number>(
      'imbot.message.add',
      { ...fields, BOT_ID: this.botId },
    );
  }

  /**
   * Update message
   * @param fields
   */
  async updateMessage(fields: Omit<B24ImbotUpdateMessageOptions, 'BOT_ID'>) {
    return this.bitrixService.callMethod<B24ImbotUpdateMessageOptions, boolean>(
      'imbot.message.update',
      {
        ...fields,
        BOT_ID: this.botId,
      },
    );
  }

  /**
   * Register new bot
   * see: https://apidocs.bitrix24.ru/api-reference/chat-bots/imbot-register.html
   * @param fields
   */
  private async registerBot(fields: B24ImbotRegisterOptions) {
    return this.bitrixService.callMethod<B24ImbotRegisterOptions, number>(
      'imbot.register',
      fields,
    );
  }

  /**
   * Unregister bot.
   * see: https://apidocs.bitrix24.ru/api-reference/chat-bots/imbot-unregister.html
   * @param fields
   */
  private async unregisterBot(fields: B24ImbotUnRegisterOptions) {
    return this.bitrixService.callMethod<B24ImbotUnRegisterOptions, boolean>(
      'imbot.unregister',
      fields,
    );
  }

  async getBotList() {
    return this.bitrixService.callMethod<never, ImbotBot[]>('imbot.bot.list');
  }

  get BOT_ID(): string {
    return this.botId;
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
    this.logger.info({ message: `New command handler`, body }, true);
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
        if (![27, 442, 460].includes(pushButtonUserId)) {
          response = Promise.resolve(
            `Forbidden push button ${pushButtonUserId}`,
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

      default:
        status = false;
        response = Promise.resolve('Not handled yet');
        break;
    }

    response
      .then((result) => {
        this.logger.info({ message: 'Result handled button', result }, true);
      })
      .catch((error) => {
        this.logger.error(error, true);
      });

    return status;
  }

  /**
   * Handle button with command **distributeNewDeal**
   * Function update deal and send message in chat about distribute deal on target project-manager
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
    const { dealId, department, chatId, managerId, stage, assignedFieldId } =
      fields;

    const { DIALOG_ID, MESSAGE_ID } = params;
    const deal = await this.dealService.getDealById(dealId, 'force');
    let nextStage = stage ?? '';

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
          BOT_ID: this.botId,
          DIALOG_ID: chatId,
          MESSAGE:
            'Распределение сделки ' +
            this.bitrixService.generateDealUrl(dealId, deal.TITLE) +
            ` на [user=${managerId}][/user]${secondManager}[br]` +
            this.getRandomDistributeMessage(),
        },
      };

      // Обновляем сообщение. Помечаем его как "Обработанное"
      batchCommands['update_old_message'] = {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.botId,
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
        BOT_ID: this.botId,
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
      (await this.departmentService.getDepartmentById(['98']))[0].UF_HEAD ?? '';

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
          BOT_ID: this.botId,
          MESSAGE_ID: messageId,
          MESSAGE: changeMessage,
          KEYBOARD: '',
        },
      },
    });
    return true;
  }

  /**
   * Handle button with commnad **approveSiteForCase**
   * Function update project manager message set was handling in deal
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
    const batchCommands: B24BatchCommands = {
      update_message: {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.botId,
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
          BOT_ID: this.botId,
          DIALOG_ID: this.bitrixService.ADDY_CASES_CHAT_ID, // Чат для кейсов,
          MESSAGE:
            'Этот сайт соответствует требованиям для кейса[br]Сделка: ' +
            this.bitrixService.generateDealUrl(dealId),
        },
      };
    }

    this.bitrixService.callBatch(batchCommands);
    return true;
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
          this.logger.info(
            {
              message: 'Check respose from avito on reject distributed ai lead',
              data: response,
            },
            true,
          );
        })
        .catch((err) => {
          this.logger.error(
            {
              message:
                'Error on send reject distribute lead by AI to avito service',
              error: err,
            },
            true,
          );
        });
      return false;
    }

    this.avitoIntegrationService.distributeClientRequestFromAvito(fields);
    return true;
  }

  /**
   * Handle command **approveReceivedPayment**:
   * update and send new message in G-pay chat
   *
   * @param fields
   * @param messageId
   * @param dialogId
   */
  public async handleApprovePayment(
    fields: ImbotKeyboardPaymentsNoticeWaiting,
    messageId: number,
    dialogId: string,
  ) {
    const { message } = fields;
    const messageDecoded = this.decodeText(message);

    this.logger.debug({ ...fields, messageId, dialogId }, 'log');

    // Обновляем сообещние и отправляем новое о том, что платеж поступил
    this.bitrixService.callBatch({
      update_message: {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.botId,
          MESSAGE_ID: messageId,
          MESSAGE: messageDecoded,
          KEYBOARD: '',
        },
      },
      send_new_message: {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.botId,
          DIALOG_ID: dialogId,
          MESSAGE: messageDecoded + '[br][br][b]ПЛАТЕЖ ПОСТУПИЛ[/b]',
        },
      },
    });
  }

  public encodeText(message: string): Buffer<ArrayBuffer> {
    return Buffer.from(message, 'utf8');
  }

  public decodeText(message: Buffer<ArrayBuffer>): string {
    return Buffer.from(message).toString('utf8');
  }

  private getRandomDistributeMessage() {
    return this.distributeDealMessages[
      Math.floor(Math.random() * this.distributeDealMessages.length)
    ];
  }

  public async sendTestMessage(message: string) {
    const { result } = await this.sendMessage({
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE: message,
      URL_PREVIEW: 'N',
    });

    return result;
  }
}
