import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixEventsAdapter } from '@/modules/bitrix/infrastructure/events/events.adapter';

export const eventProviders = [
  {
    provide: B24PORTS.EVENTS.EVENTS_DEFAULT,
    useClass: BitrixEventsAdapter,
  },
];
