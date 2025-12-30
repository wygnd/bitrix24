import axios from 'axios';
import { bitrixLeadProviders } from '@/modules/bitrix/modules/lead/lead.providers';
import { bitrixWikiProviders } from '@/modules/bitrix/modules/integration/wiki/wiki.providers';

export const bitrixProviders = [
  {
    provide: 'BitrixApiService',
    useValue: axios.create({}),
  },
  ...bitrixLeadProviders,
  ...bitrixWikiProviders,
];
