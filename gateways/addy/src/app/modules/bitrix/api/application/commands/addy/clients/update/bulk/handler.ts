import { B24AddyClientBulkUpdateClientsCommand } from './command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { B24PORTS } from '../../../../../../../constants/ports/constant';
import type { B24AddyClientsRepoPort } from '../../../../../ports/addy/clients/repo/port';

@CommandHandler(B24AddyClientBulkUpdateClientsCommand)
export class B24AddyClientsBulkUpdateClientsCommandHandler implements ICommandHandler<B24AddyClientBulkUpdateClientsCommand> {
  constructor(
    @Inject(B24PORTS.ADDY.ADDY_CLIENTS_REPO)
    private readonly repo: B24AddyClientsRepoPort,
  ) {}

  async execute(command: B24AddyClientBulkUpdateClientsCommand) {
    return this.repo.bulkUpdateClients(command.fields);
  }
}
