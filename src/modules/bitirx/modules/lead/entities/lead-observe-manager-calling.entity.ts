import { Column, DataType, Model, Table } from 'sequelize-typescript';
import {
  LeadObserveManagerCallingAttributes,
  LeadObserveManagerCallingCreationalAttributes,
} from '@/modules/bitirx/modules/lead/interfaces/lead-observe-manager-calling.interface';

@Table({ tableName: 'lead_observe_manager_calling' })
export class LeadObserveManagerCallingModel extends Model<
  LeadObserveManagerCallingAttributes,
  LeadObserveManagerCallingCreationalAttributes
> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'lead_id',
  })
  declare leadId: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'date_calling',
  })
  declare dateCalling: Date;
}
