import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { B24AddyClientsGetClientByEmailQuery } from './query';
import { Inject } from '@nestjs/common';
import { B24PORTS } from '../../../../../../../constants/ports/constant';
import type { B24AddyClientsRepoPort } from '../../../../../ports/addy/clients/repo/port';
import { B24AddyClientsMapper } from '../../../../../../infrastructure/persistence/mappers/addy/clients/mapper';

@QueryHandler(B24AddyClientsGetClientByEmailQuery)
export class B24AddyClientsGetClientByEmailQueryHandler implements IQueryHandler<B24AddyClientsGetClientByEmailQuery> {
  constructor(
    @Inject(B24PORTS.ADDY.ADDY_CLIENTS_REPO)
    private readonly repo: B24AddyClientsRepoPort,
  ) {}

  async execute(query: B24AddyClientsGetClientByEmailQuery) {
    const model = await this.repo.getClientBy('email', query.email);
    return B24AddyClientsMapper.toDomain(model);
  }
}
