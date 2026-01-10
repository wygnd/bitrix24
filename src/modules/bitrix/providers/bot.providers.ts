import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixBotAdapter } from '@/modules/bitrix/infrastructure/bot/bot.adapter';

export const botProviders = [
  {
    provide: B24PORTS.BOT.BOT_DEFAULT,
    useClass: BitrixBotAdapter,
  },
];
