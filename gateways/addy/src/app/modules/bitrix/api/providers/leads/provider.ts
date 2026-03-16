import { B24PORTS } from '../../constants/ports/constant';
import { B24LeadsAdapter } from '../../infrastructure/adapters/leads/adapter';

export const bitrixLeadsProviders = [
  { provide: B24PORTS.LEADS.LEADS_DEFAULT, useClass: B24LeadsAdapter },
];
