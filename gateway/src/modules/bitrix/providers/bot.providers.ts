import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixBotAdapter } from '@/modules/bitrix/infrastructure/adapters/bot/bot.adapter';
import { BitrixBotCommandsRepository } from '@/modules/bitrix/infrastructure/database/repositories/bot/bot-commands.repository';

const { BOT_DEFAULT, BOT_COMMANDS_REPOSITORY } = B24PORTS.BOT;

export const botProviders = [
  {
    provide: BOT_DEFAULT,
    useClass: BitrixBotAdapter,
  },
  {
    provide: BOT_COMMANDS_REPOSITORY,
    useClass: BitrixBotCommandsRepository,
  },
];
