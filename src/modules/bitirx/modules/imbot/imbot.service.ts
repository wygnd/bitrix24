import {
  BadRequestException,
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
import { OnImCommandKeyboardDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-events.dto';
import { NotifyConvertedDeal } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events-handle.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { ConfigService } from '@nestjs/config';
import { BitrixConstants } from '@/common/interfaces/bitrix-config.interface';
import { ImbotBot } from '@/modules/bitirx/modules/imbot/interfaces/imbot-bot.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { ImbotCommand } from '@/modules/bitirx/modules/imbot/interfaces/imbot.interface';
import {
  ImbotHandleApproveSmmAdvertLayout,
  ImbotHandleDistributeNewDeal,
  ImbotHandleDistributeNewDealReject,
  ImbotHandleDistributeNewDealUnknown,
} from '@/modules/bitirx/modules/imbot/interfaces/imbot-handle.interface';
import { WikiService } from '@/modules/wiki/wiki.service';
import { B24EventParams } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';
import { B24DepartmentTypeId } from '@/modules/bitirx/modules/department/department.interface';
import { BitrixDealService } from '@/modules/bitirx/modules/deal/deal.service';

@Injectable()
export class BitrixImBotService {
  private readonly botId: string;
  private readonly distributeDealMessages: string[];

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly wikiService: WikiService,
    private readonly dealService: BitrixDealService,
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
  async removeCommand(fields: ImbotUnregisterCommandDto) {
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
  async registerBot(fields: B24ImbotRegisterOptions) {
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
  async unregisterBot(fields: B24ImbotUnRegisterOptions) {
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

  async notifyAboutConvertedDeal(eventData: OnImCommandKeyboardDto) {
    const { MESSAGE, MESSAGE_ID } = eventData.data.PARAMS;
    const [, fields] = MESSAGE.split(' ', 2);
    const { dealId, isFits, oldMessage } = JSON.parse(
      fields,
    ) as NotifyConvertedDeal;

    const commands: B24BatchCommands = {
      update_message: {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.bitrixService.BOT_ID,
          MESSAGE_ID: MESSAGE_ID,
          MESSAGE:
            `[b]Обработано: ${isFits ? 'Сайт подходит' : 'Сайт не подходит'}[/b][br][br]` +
            Buffer.from(oldMessage).toString('utf8'),
          KEYBOARD: '',
        },
      },
      update_deal: {
        method: 'crm.deal.update',
        params: {
          id: dealId,
          fields: {
            UF_CRM_1760972834021: '1',
          },
        },
      },
    };

    if (isFits) {
      commands['send_message'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: 220, // Ирина Новолоцкая
          MESSAGE:
            'Этот сайт соответствует требованиям для кейса[br]Сделка: ' +
            this.bitrixService.generateDealUrl(dealId),
        },
      };
    }

    const response = await this.bitrixService.callBatch<
      B24BatchResponseMap<{
        update_message: boolean;
        send_message: number;
        update_deal: boolean;
      }>
    >(commands);

    const errors = Object.values(response.result.result_error);
    if (errors.length !== 0) {
      const message = errors.reduce((acc, { error, error_description }) => {
        acc += `${error}---${error_description}|||`;
        return acc;
      }, '');
      throw new Error(`Invalid on batch request: ${message}`);
    }

    return true;
  }

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

      case 'distributeDealReject':
        return this.handleDistributeNewDealReject(
          fields as ImbotHandleDistributeNewDealReject,
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
    const {
      dealId,
      department,
      chatId,
      managerId,
      managerName,
      stage,
      assignedFieldId,
    } = fields;

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
      send_next_chat_message: {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.botId,
          DIALOG_ID: chatId,
          MESSAGE:
            'Распределение сделки ' +
            this.bitrixService.generateDealUrl(dealId, deal.TITLE) +
            ` на [user=${managerId}][/user][br] ` +
            this.getRandomDistributeMessage(),
        },
      },
    };

    batchCommands['update_deal'] = {
      method: 'crm.deal.update',
      params: {
        id: dealId,
        fields: {
          [assignedFieldId]: managerId,
          STAGE_ID: nextStage,
        },
      },
    };

    if (stage) {
      // Если Ответственный SEO специалист выбран
      // в сообщении его тоже указать надо
      const secondManager = deal['UF_CRM_1703764564']
        ? ` и [user=${deal['UF_CRM_1703764564']}][/user]`
        : '';

      batchCommands['update_old_message'] = {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.botId,
          MESSAGE_ID: MESSAGE_ID,
          DIALOG_ID: DIALOG_ID,
          MESSAGE:
            '>>[b]Обработано[/b][br]' +
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

    this.updateMessage({
      DIALOG_ID: DIALOG_ID,
      MESSAGE_ID: MESSAGE_ID,
      MESSAGE:
        '>>[b]Обработано: Брак[/b][br]' +
        this.bitrixService.generateDealUrl(dealId, dealTitle),
      KEYBOARD: '',
    });

    return true;
  }

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
    let message = '';
    let changeMessage = '';
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
}
