import { BitrixPlacementsAdapter } from '@/modules/bitrix/infrastructure/adapters/placements/placements.adapter';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';

export const placementProviders = [
  {
    provide: B24PORTS.PLACEMENTS.PLACEMENTS_DEFAULT,
    useClass: BitrixPlacementsAdapter,
  },
];
