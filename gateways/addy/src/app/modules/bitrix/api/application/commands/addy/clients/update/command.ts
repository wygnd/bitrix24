import { TB24AddyClientUpdateEntity } from '../../../../interfaces/addy/integration/clients/entities/entity';
import { Command } from '@nestjs/cqrs';

export class B24AddyClientUpdateClientCommand extends Command<boolean> {
  constructor(
    public readonly clientId: number,
    public readonly updateFields: TB24AddyClientUpdateEntity,
  ) {
    super();
  }
}
