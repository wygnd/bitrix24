import { Model } from 'sequelize';
import { Table } from 'sequelize-typescript';
import {
  IB24AddyClientModel,
  TB24AddyClientCreationModel,
} from '../../../entities/addy/clients/entity';

@Table({
  tableName: 'bitrix_addy_clients',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class B24AddyClientsEntity extends Model<
  IB24AddyClientModel,
  TB24AddyClientCreationModel
> {
  declare id: number;
}
