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
} from './imbot.interface';
import { OnImCommandKeyboardDto } from '@/modules/bitirx/modules/imbot/dtos/events.dto';
import { NotifyConvertedDeal } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events-handle.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { ConfigService } from '@nestjs/config';
import { BitrixConstants } from '@/common/interfaces/bitrix-config.interface';
import { ImbotBot } from '@/modules/bitirx/modules/imbot/interfaces/imbot-bot.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { ImbotCommand } from '@/modules/bitirx/modules/imbot/interfaces/imbot.interface';
import { ImbotHandleApproveSmmAdvertLayout } from '@/modules/bitirx/modules/imbot/interfaces/imbot-handle.interface';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';

@Injectable()
export class BitrixImBotService {
  private readonly botId: string;

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly taskService: BitrixTaskService,
  ) {
    const bitrixConstants =
      this.configService.get<BitrixConstants>('bitrixConstants');

    if (!bitrixConstants)
      throw new Error('BITRIX BOT MODULE: Invalid config constants');

    const { BOT_ID } = bitrixConstants;

    this.botId = BOT_ID;
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

  async distributeNewDeal(eventData: OnImCommandKeyboardDto) {}

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
    let message = 'Макет согласован.[br]';
    // Если согласованно
    if (isApproved) {
      this.taskService.setTaskComplete(taskId);
      message = 'Макет согласован. Задача завершена[br]';
    }

    message += this.bitrixService.generateTaskUrl(responsibleId, taskId);

    const batchCommandsSendMessage: B24BatchCommands = {
      update_old_message: {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.botId,
          MESSAGE_ID: messageId,
          MESSAGE: oldMessage,
          KEYBOARD: '',
        },
      },
      send_message_to_responsible: {
        method: 'im.message.add',
        params: {
          DIALOG_ID: responsibleId,
          MESSAGE: message,
        },
      },
    };

    if (accomplices.length > 0) {
      accomplices.forEach((userId) => {
        batchCommandsSendMessage['send_message_to'] = {
          method: 'im.message.add',
          params: {
            DIALOG_ID: userId,
            MESSAGE: message,
          },
        };
      });
    }

    this.bitrixService.callBatch(batchCommandsSendMessage);
    this.sendMessage({
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE: 'Обработана кнопка: ' + JSON.stringify(batchCommandsSendMessage),
    });
  }
}
