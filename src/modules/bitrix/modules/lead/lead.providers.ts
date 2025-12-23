import { LeadObserveManagerCallingModel } from '@/modules/bitrix/modules/lead/entities/lead-observe-manager-calling.entity';
import { LEAD_OBSERVE_MANAGER_REPOSITORY } from '@/modules/bitrix/modules/lead/constants/lead.constants';
import { LEAD_UPSELL_REPOSITORY } from '@/modules/bitrix/modules/lead/constants/lead-upsell.constants';
import { LeadUpsellModel } from '@/modules/bitrix/modules/lead/entities/lead-upsell.entity';

export const bitrixLeadProviders = [
  {
    provide: LEAD_OBSERVE_MANAGER_REPOSITORY,
    useValue: LeadObserveManagerCallingModel,
  },
  {
    provide: LEAD_UPSELL_REPOSITORY,
    useValue: LeadUpsellModel,
  },
];
