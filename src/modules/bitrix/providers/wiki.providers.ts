import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixLeadsUpsellRepository } from '@/modules/bitrix/infrastructure/database/repositories/leads/leads-upsell.repository';
import { B24WikiClientPaymentsModel } from '@/modules/bitrix/infrastructure/database/entities/wiki/wiki-client-payments.entity';
import { WIKI_CLIENT_PAYMENTS_REPOSITORY } from '@/modules/bitrix/application/constants/wiki/wiki-client-payments.constants';

export const wikiProviders = [
  {
    provide: WIKI_CLIENT_PAYMENTS_REPOSITORY,
    useValue: B24WikiClientPaymentsModel,
  },
  {
    provide: B24PORTS.WIKI.WIKI_CLIENT_PAYMENTS_REPOSITORY,
    useClass: BitrixLeadsUpsellRepository,
  },
];
