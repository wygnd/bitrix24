import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { B24AddyClientUpdateClientCommand } from './command';
import type { B24AddyClientsRepoPort } from '../../../../ports/addy/clients/repo/port';
import { Inject } from '@nestjs/common';
import { B24PORTS } from '../../../../../../constants/ports/constant';

@CommandHandler(B24AddyClientUpdateClientCommand)
export class B24AddyClientsUpdateClientCommandHandler implements ICommandHandler<B24AddyClientUpdateClientCommand> {
  constructor(
    @Inject(B24PORTS.ADDY.ADDY_CLIENTS_REPO)
    private readonly repo: B24AddyClientsRepoPort,
  ) {}

  async execute(command: B24AddyClientUpdateClientCommand) {
    return this.repo.updateClient(command.clientId, command.updateFields);
  }
}
