import { bitrixAddyClientsRepositoryProvider } from './clients/providers';
import { bitrixAddyClientsQueriesProviders } from './queries/provider';
import { bitrixAddyClientsCommandsProvider } from './commands/provider';
import { B24AddyIntegrationUseCase } from '../../use-cases/addy/integration/clients/use-case';

export const bitrixAddyProviders = [
  bitrixAddyClientsRepositoryProvider,
  B24AddyIntegrationUseCase,

  // Commands
  ...bitrixAddyClientsCommandsProvider,

  // Queries
  ...bitrixAddyClientsQueriesProviders,
];
