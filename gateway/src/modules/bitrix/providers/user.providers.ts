import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixUsersAdapter } from '@/modules/bitrix/infrastructure/adapters/users/users.adapter';

export const userProviders = [
  {
    provide: B24PORTS.USERS.USERS_DEFAULT,
    useClass: BitrixUsersAdapter
  }
];