import { Query } from '@nestjs/cqrs';
import { IB24AddyClientEntity } from '../../../interfaces/addy/integration/clients/entities/entity';
import { FindOptions } from 'sequelize';

export class B24AddyClientsGetClientsQuery extends Query<
  IB24AddyClientEntity[]
> {
  constructor(public readonly options: FindOptions<IB24AddyClientEntity>) {
    super();
  }
}
