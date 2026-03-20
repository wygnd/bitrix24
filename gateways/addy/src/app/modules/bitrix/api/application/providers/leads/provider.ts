import { B24PORTS } from '../../../../constants/ports/constant';
import { B24LeadsAdapter } from '../../../infrastructure/adapters/leads/adapter';
import { B24LeadsUseCase } from '../../use-cases/leads/use-case';

export const bitrixLeadsProviders = [
  { provide: B24PORTS.LEADS.LEADS_DEFAULT, useClass: B24LeadsAdapter },
  B24LeadsUseCase,
];
