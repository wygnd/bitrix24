import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixDealsAdapter } from '@/modules/bitrix/infrastructure/deals/deals.adapter';

export const bitrixDealProviders = [
  {
    provide: B24PORTS.DEALS.DEALS_DEFAULT,
    useClass: BitrixDealsAdapter,
  },
];
