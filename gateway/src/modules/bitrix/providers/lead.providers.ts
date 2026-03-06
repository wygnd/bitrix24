import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixLeadsAdapter } from '@/modules/bitrix/infrastructure/adapters/leads/leads.adapter';
import { BitrixLeadsUpsellRepository } from '@/modules/bitrix/infrastructure/database/repositories/leads/leads-upsell.repository';
import { BitrixLeadsMangerCallingRepository } from '@/modules/bitrix/infrastructure/database/repositories/leads/leads-manager-calling.repository';

export const leadProviders = [
  {
    provide: B24PORTS.LEADS.LEADS_DEFAULT,
    useClass: BitrixLeadsAdapter,
  },
  {
    provide: B24PORTS.LEADS.UPSELLS_REPOSITORY,
    useClass: BitrixLeadsUpsellRepository,
  },
  {
    provide: B24PORTS.LEADS.MANAGER_CALLING_REPOSITORY,
    useClass: BitrixLeadsMangerCallingRepository,
  },
];
