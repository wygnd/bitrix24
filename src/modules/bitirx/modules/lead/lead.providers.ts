import { LeadObserveManagerCallingModel } from '@/modules/bitirx/modules/lead/entities/lead-observe-manager-calling.entity';
import { LEAD_OBSERVE_MANAGER_REPOSITORY } from '@/modules/bitirx/modules/lead/lead.constants';

export const bitrixLeadProviders = [
  {
    provide: LEAD_OBSERVE_MANAGER_REPOSITORY,
    useValue: LeadObserveManagerCallingModel,
  },
];
