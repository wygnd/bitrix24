import { Model, DataType, Column, Table } from 'sequelize-typescript';
import {
  IB24AddyClientEntity,
  TB24AddyClientCreationEntity,
} from '../../../../../application/interfaces/addy/integration/clients/entities/entity';
import type { TB24AddyClientStatus } from '../../../../../application/interfaces/addy/integration/clients/entities/entity';

@Table({
  tableName: 'bitrix_addy_clients',
})
export class B24AddyClientsModel extends Model<
  IB24AddyClientEntity,
  TB24AddyClientCreationEntity
> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
  })
  declare name: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'has_first_contract',
  })
  declare hasFirstContract: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
    field: 'check_in',
  })
  declare checkIn: string | null;

  @Column({
    type: DataType.BOOLEAN(),
    defaultValue: false,
    field: 'was_handled',
  })
  declare wasHandled: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: '',
  })
  declare status: TB24AddyClientStatus | null;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: string;

  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: string;
}
