import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { B24AddyClientsGetClientByEmailQuery } from './get-client/by-email/query';
import { Inject } from '@nestjs/common';
import { B24PORTS } from '../../../../../constants/ports/constant';
import type { B24AddyClientsRepoPort } from '../../../ports/addy/clients/repo/port';
import { B24AddyClientsMapper } from '../../../../infrastructure/persistence/mappers/addy/clients/mapper';
import { B24AddyClientsGetClientsQuery } from './query';

@QueryHandler(B24AddyClientsGetClientsQuery)
export class B24AddyClientsGetClientsQueryHandler implements IQueryHandler<B24AddyClientsGetClientsQuery> {
  constructor(
    @Inject(B24PORTS.ADDY.ADDY_CLIENTS_REPO)
    private readonly repo: B24AddyClientsRepoPort,
  ) {}

  async execute(query: B24AddyClientsGetClientsQuery) {
    const models = await this.repo.getClientList(query.options);
    return models.map((m) => B24AddyClientsMapper.toDomain(m));
  }
}
