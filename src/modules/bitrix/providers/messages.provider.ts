import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixMessagesAdapter } from '@/modules/bitrix/infrastructure/adapters/messages/messages.adapter';

export const messageProviders = [
  {
    provide: B24PORTS.MESSAGES.MESSAGES_DEFAULT,
    useClass: BitrixMessagesAdapter,
  },
];
