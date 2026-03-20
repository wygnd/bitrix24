import { Command } from '@nestjs/cqrs';
import { IB24AddyClientBulkUpdate } from '../../../../../interfaces/addy/integration/clients/entities/entity';

export class B24AddyClientBulkUpdateClientsCommand extends Command<void> {
  constructor(public readonly fields: IB24AddyClientBulkUpdate[]) {
    super();
  }
}
