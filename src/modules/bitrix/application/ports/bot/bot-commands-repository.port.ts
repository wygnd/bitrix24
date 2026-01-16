import { BitrixBotCommandsDTO } from '@/modules/bitrix/application/dtos/bot/bot-commands.dto';
import {
  BitrixBotCommandsAttributes,
  BitrixBotCommandsCreationalAttributes,
  BitrixBotCommandsUpdateAttributes,
} from '@/modules/bitrix/application/interfaces/bot/bot-commands.interface';
import { FindOptions } from 'sequelize';

export interface BitrixBotCommandsRepositoryPort {
  getCommands(
    options?: FindOptions<BitrixBotCommandsAttributes>,
  ): Promise<BitrixBotCommandsDTO[]>;
  getCommand(commandId: number): Promise<BitrixBotCommandsDTO | null>;
  createCommand(
    fields: BitrixBotCommandsCreationalAttributes,
  ): Promise<BitrixBotCommandsDTO | null>;
  updateCommand(
    commandId: number,
    fields: BitrixBotCommandsUpdateAttributes,
  ): Promise<boolean>;
  removeCommand(commandId: number): Promise<boolean>;
}
