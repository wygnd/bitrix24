import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixLeadsAdapter } from '@/modules/bitrix/infrastructure/adapters/leads/leads.adapter';
import { LEAD_OBSERVE_MANAGER_REPOSITORY } from '@/modules/bitrix/application/constants/leads/lead.constants';
import { LeadObserveManagerCallingModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-observe-manager-calling.entity';
import { LEAD_UPSELL_REPOSITORY } from '@/modules/bitrix/application/constants/leads/lead-upsell.constants';
import { LeadUpsellModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-upsell.entity';
import {
  BitrixLeadsUpsellRepository
} from '@/modules/bitrix/infrastructure/database/repositories/leads/leads-upsell.repository';
import {
  BitrixLeadsMangerCallingRepository
} from '@/modules/bitrix/infrastructure/database/repositories/leads/leads-manager-calling.repository';

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
  {
    provide: LEAD_OBSERVE_MANAGER_REPOSITORY,
    useValue: LeadObserveManagerCallingModel,
  },
  {
    provide: LEAD_UPSELL_REPOSITORY,
    useValue: LeadUpsellModel,
  },
];
