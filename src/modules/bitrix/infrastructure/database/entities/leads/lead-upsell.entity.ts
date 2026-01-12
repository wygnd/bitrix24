import { Column, DataType, Model, Table } from 'sequelize-typescript';
import {
  B24LeadUpsellAttributes,
  B24LeadUpsellCreationalAttributes,
  B24LeadUpsellStatuses,
} from '@/modules/bitrix/application/interfaces/leads/lead-upsell.interface';
import { B24DealCategories } from '@/modules/bitrix/interfaces/bitrix.interface';

@Table({ tableName: 'lead_upsells' })
export class LeadUpsellModel extends Model<
  B24LeadUpsellAttributes,
  B24LeadUpsellCreationalAttributes
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
    field: 'lead_id',
  })
  declare leadId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'deal_id',
  })
  declare dealId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare status: B24LeadUpsellStatuses;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare category: B24DealCategories;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'date_notify',
  })
  declare dateNotify: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'deal_stage',
  })
  declare dealStage: string;
}
