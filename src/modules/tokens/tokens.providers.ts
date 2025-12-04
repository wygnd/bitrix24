import { TokensModel } from '@/modules/tokens/tokens.entity';
import { TOKENS_REPOSITORY } from '@/modules/tokens/tokens.constants';

export const tokensProviders = [
  {
    provide: TOKENS_REPOSITORY,
    useValue: TokensModel,
  },
];
