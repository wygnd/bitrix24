import {
  B24ImbotRegisterCommand,
  B24ImbotSendMessageOptions,
  B24ImbotUpdateMessageOptions,
  ImbotCommand,
} from '@/modules/bitrix/application/interfaces/bot/imbot.interface';
import { ImbotBot } from '@/modules/bitrix/application/interfaces/bot/imbot-bot.interface';

export interface BitrixBotPort {
  addCommand(fields: B24ImbotRegisterCommand): Promise<number>;
  getBotCommands(): Promise<ImbotCommand[]>;
  getBotCommandById(commandId: string): Promise<ImbotCommand | null>;
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
