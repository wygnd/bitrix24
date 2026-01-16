import { Column, DataType, Model, Table } from 'sequelize-typescript';
import {
  BitrixBotCommandsAttributes,
  BitrixBotCommandsCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/bot/bot-commands.interface';

@Table({
  tableName: 'bot_commands',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BitrixBotCommandsModel extends Model<
  BitrixBotCommandsAttributes,
  BitrixBotCommandsCreationalAttributes
> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'bot_id',
  })
  declare botId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'command_id',
  })
  declare commandId: number;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  declare command: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare description?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare handler: string;
}
