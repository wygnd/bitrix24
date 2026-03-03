import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixStorageAdapter } from '@/modules/bitrix/infrastructure/adapters/storage/storage.adapter';

export const storageProviders = [
  {
    provide: B24PORTS.STORAGE.STORAGE_DEFAULT,
    useClass: BitrixStorageAdapter,
  },
];