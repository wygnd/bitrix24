import { LeadObserveManagerCallingModel } from '@/modules/bitrix/modules/lead/entities/lead-observe-manager-calling.entity';
import { LEAD_OBSERVE_MANAGER_REPOSITORY } from '@/modules/bitrix/modules/lead/constants/lead.constants';

export const bitrixLeadProviders = [
  {
    provide: LEAD_OBSERVE_MANAGER_REPOSITORY,
    useValue: LeadObserveManagerCallingModel,
  },
];
