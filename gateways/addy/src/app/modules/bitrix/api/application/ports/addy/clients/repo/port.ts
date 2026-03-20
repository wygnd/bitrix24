import { B24AddyClientsModel } from '../../../../../infrastructure/persistence/models/addy/clients/model';
import {
  IB24AddyClientBulkUpdate,
  IB24AddyClientEntity,
  TB24AddyClientCreationEntity,
  TB24AddyClientGetClient,
  TB24AddyClientUpdateEntity,
} from '../../../../interfaces/addy/integration/clients/entities/entity';
import { FindOptions } from 'sequelize';

export interface B24AddyClientsRepoPort {
  addClient(fields: TB24AddyClientCreationEntity): Promise<B24AddyClientsModel>;
  getClientBy(
    type: TB24AddyClientGetClient,
    field: string | number,
  ): Promise<B24AddyClientsModel>;
  updateClient(
    clientId: number,
    fields: TB24AddyClientUpdateEntity,
  ): Promise<boolean>;
  getClientList(
    options?: FindOptions<IB24AddyClientEntity>,
  ): Promise<B24AddyClientsModel[]>;
  bulkUpdateClients(fields: IB24AddyClientBulkUpdate[]): Promise<void>;
}
