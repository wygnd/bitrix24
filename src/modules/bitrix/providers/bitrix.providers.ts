import axios from 'axios';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixAdapter } from '@/modules/bitrix/infrastructure/adapters/common/bitrix.adapter';

export const bitrixProviders = [
  {
    provide: 'BitrixApiService',
    useValue: axios.create({}),
  },
  {
    provide: B24PORTS.BITRIX,
    useClass: BitrixAdapter,
  },
];
