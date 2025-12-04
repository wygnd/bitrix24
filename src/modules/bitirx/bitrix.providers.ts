import axios from 'axios';
import { bitrixLeadProviders } from '@/modules/bitirx/modules/lead/lead.providers';

export const bitrixProviders = [
  {
    provide: 'BitrixApiService',
    useValue: axios.create({}),
  },
  ...bitrixLeadProviders,
];
