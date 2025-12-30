import { Column, DataType, Model, Table } from 'sequelize-typescript';
import {
  B24WikiClientPaymentsAttributes,
  B24WikiClientPaymentsCreationalAttributes,
} from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-client-payments.interface';

@Table({
  tableName: 'wiki_client_payments',
  timestamps: true,
})
export class B24WikiClientPaymentsModel extends Model<
  B24WikiClientPaymentsAttributes,
  B24WikiClientPaymentsCreationalAttributes
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
    field: 'INN',
  })
  declare inn: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'department_id',
  })
  declare departmentId: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: '',
    field: 'department_name',
  })
  declare departmentName: string;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: Date;
}
