import { Command } from '@nestjs/cqrs';
import { IB24AddyClientEntity } from '../../../../interfaces/addy/integration/clients/entities/entity';

export class B24AddyClientsAddClientCommand extends Command<IB24AddyClientEntity> {
  constructor(
    public readonly email: string,
    public readonly name: string,
  ) {
    super();
  }
}
