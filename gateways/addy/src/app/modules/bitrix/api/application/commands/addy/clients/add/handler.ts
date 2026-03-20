import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { B24AddyClientsAddClientCommand } from './command';
import type { B24AddyClientsRepoPort } from '../../../../ports/addy/clients/repo/port';
import { Inject } from '@nestjs/common';
import { B24PORTS } from '../../../../../../constants/ports/constant';
import { B24AddyClientsMapper } from '../../../../../infrastructure/persistence/mappers/addy/clients/mapper';

@CommandHandler(B24AddyClientsAddClientCommand)
export class B24AddyClientsAddClientCommandHandler implements ICommandHandler<B24AddyClientsAddClientCommand> {
  constructor(
    @Inject(B24PORTS.ADDY.ADDY_CLIENTS_REPO)
    private readonly repo: B24AddyClientsRepoPort,
  ) {}

  async execute(command: B24AddyClientsAddClientCommand) {
    const model = await this.repo.addClient(command);
    return B24AddyClientsMapper.toDomain(model);
  }
}
