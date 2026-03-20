import { B24AddyClientsGetClientByEmailQueryHandler } from '../../../queries/addy/clients/get-client/by-email/handler';
import { B24AddyClientsGetClientsQueryHandler } from '../../../queries/addy/clients/handler';

export const bitrixAddyClientsQueriesProviders = [
  B24AddyClientsGetClientByEmailQueryHandler,
  B24AddyClientsGetClientsQueryHandler,
];
