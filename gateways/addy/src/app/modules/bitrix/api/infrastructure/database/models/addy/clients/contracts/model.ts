import { Model } from 'sequelize';
import { Table } from 'sequelize-typescript';

@Table({
  tableName: 'bitrix_addy_clients_contracts',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class B24AddyClientsContractsEntity extends Model {}
