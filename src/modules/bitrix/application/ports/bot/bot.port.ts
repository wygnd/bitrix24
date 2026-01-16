import {
  B24ImbotRegisterCommand,
  B24ImbotSendMessageOptions,
  B24ImbotUpdateMessageOptions,
} from '@/modules/bitrix/application/interfaces/bot/imbot.interface';
import { ImbotBot } from '@/modules/bitrix/application/interfaces/bot/imbot-bot.interface';
import { BitrixBotCommandsDTO } from '@/modules/bitrix/application/dtos/bot/bot-commands.dto';

export interface BitrixBotPort {
  addCommand(
    fields: B24ImbotRegisterCommand,
  ): Promise<BitrixBotCommandsDTO | null>;
  getBotCommands(): Promise<BitrixBotCommandsDTO[]>;
  getBotCommandById(commandId: string): Promise<BitrixBotCommandsDTO | null>;
  sendMessage(
    fields: Omit<B24ImbotSendMessageOptions, 'BOT_ID'>,
  ): Promise<number>;
  updateMessage(
    fields: Omit<B24ImbotUpdateMessageOptions, 'BOT_ID'>,
  ): Promise<boolean>;
  encodeText(message: string): Buffer<ArrayBuffer>;
  decodeText(message: Buffer<ArrayBuffer>): string;
  sendTestMessage(message: string): Promise<void>;
  limitAccessByPushButton(userId: string, userIds: string[]): boolean;
  getRandomDistributingMessage(): string;
  getBotList(): Promise<ImbotBot[]>;
}
