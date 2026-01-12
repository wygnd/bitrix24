import { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import {
  B24ImbotRegisterCommand,
  B24ImbotSendMessageOptions,
  B24ImbotUpdateMessageOptions,
  ImbotCommand,
} from '@/modules/bitrix/application/interfaces/bot/imbot.interface';
import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { RedisService } from '@/modules/redis/redis.service';
import { ImbotBot } from '@/modules/bitrix/application/interfaces/bot/imbot-bot.interface';
import { BitrixConstants } from '@/common/interfaces/bitrix-config.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { ConfigService } from '@nestjs/config';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

export class BitrixBotAdapter implements BitrixBotPort {
  private readonly logger = new WinstonLogger(
    BitrixBotAdapter.name,
    'bitrix:bot'.split(':'),
  );
  private readonly botId: string;
  private readonly distributeDealMessages: string[];

  constructor(
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
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

  /**
   * Get bot command by Id
   *
   * ---
   *
   * Получить поля команды по ID
   * @param commandId
   */
  async getBotCommandById(commandId: string) {
    try {
      const commands = await this.redisService.get<ImbotCommand[]>(
        REDIS_KEYS.BITRIX_DATA_BOT_COMMANDS,
      );
      const command = commands?.find((c) => c.id === commandId);

      if (!commands || !command)
        throw new NotFoundException('Command not found');

      return command;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Send message in chat via bot
   *
   * ---
   *
   * Отправляет сообщение в чат от лица бота
   * @param fields
   */
  async sendMessage(fields: Omit<B24ImbotSendMessageOptions, 'BOT_ID'>) {
    try {
      const response = await this.bitrixService.callMethod<
        B24ImbotSendMessageOptions,
        number
      >('imbot.message.add', { ...fields, BOT_ID: this.botId });

      return response?.result ?? 0;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }

  /**
   * Update message via bot
   *
   * ---
   *
   * Обновляет сообщение, отправленное ботом
   * @param fields
   */
  async updateMessage(fields: Omit<B24ImbotUpdateMessageOptions, 'BOT_ID'>) {
    try {
      const response = await this.bitrixService.callMethod<
        B24ImbotUpdateMessageOptions,
        boolean
      >('imbot.message.update', {
        ...fields,
        BOT_ID: this.botId,
      });

      return response?.result ?? false;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Return registered bot list in bitrix24
   *
   * ---
   *
   * Возвращает список зарегистрированных ботов в битрикс24
   */
  async getBotList() {
    try {
      const response = await this.bitrixService.callMethod<never, ImbotBot[]>(
        'imbot.bot.list',
      );

      return response?.result ?? [];
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  /**
   * Limit push button by user ids
   *
   * ---
   *
   * Ограничивает нажатие кнопок по id пользователей
   * @param userId
   * @param userIds
   */
  limitAccessByPushButton(userId: string, userIds: string[]): boolean {
    return !userIds.includes(userId);
  }

  /**
   * Transform text to binary data
   *
   * ---
   *
   * Преобразовывает текст в бинарные данные
   * @param message
   */
  public encodeText(message: string): Buffer<ArrayBuffer> {
    return Buffer.from(message, 'utf8');
  }

  /**
   * Transform binary data to text
   *
   * ---
   *
   * Преобразовывает бинарные данные в строку
   * @param message
   */
  public decodeText(message: Buffer<ArrayBuffer>): string {
    return Buffer.from(message).toString('utf8');
  }

  /**
   * Return random distributing messages
   *
   * ---
   *
   * Возвращает в случайном порядке одно сообщение
   */
  public getRandomDistributingMessage() {
    return this.distributeDealMessages[
      Math.floor(Math.random() * this.distributeDealMessages.length)
    ];
  }

  /**
   * **Debugger**: send log in bitrix chat for debugging
   *
   * ---
   *
   * **Отладчик**: отправляет лог в чат битрикс для отладки
   * @param message
   */
  public async sendTestMessage(message: string) {
    this.sendMessage({
      DIALOG_ID: this.bitrixService.getConstant('TEST_CHAT_ID'),
      MESSAGE: message,
      URL_PREVIEW: 'N',
    });
  }
}
