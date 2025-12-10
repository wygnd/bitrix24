import axios from 'axios';
import { bitrixLeadProviders } from '@/modules/bitrix/modules/lead/lead.providers';

export const bitrixProviders = [
  {
    provide: 'BitrixApiService',
    useValue: axios.create({}),
  },
  ...bitrixLeadProviders,
];
