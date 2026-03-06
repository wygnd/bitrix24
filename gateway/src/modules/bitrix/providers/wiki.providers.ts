import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixWikiClientPaymentsRepository } from '@/modules/bitrix/infrastructure/database/repositories/wiki/wiki.repository';

export const wikiProviders = [
  {
    provide: B24PORTS.WIKI.WIKI_CLIENT_PAYMENTS_REPOSITORY,
    useClass: BitrixWikiClientPaymentsRepository,
  },
];
