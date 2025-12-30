import { B24WikiClientPaymentsModel } from '@/modules/bitrix/modules/integration/wiki/etities/wiki-client-payments.entity';
import { WIKI_CLIENT_PAYMENTS_REPOSITORY } from '@/modules/bitrix/modules/integration/wiki/constants/wiki-client-payments.constants';

export const bitrixWikiProviders = [
  {
    provide: WIKI_CLIENT_PAYMENTS_REPOSITORY,
    useValue: B24WikiClientPaymentsModel,
  },
];
