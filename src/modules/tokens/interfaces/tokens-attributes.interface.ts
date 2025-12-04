import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';

export interface TokensAttributes {
  id: number;
  accessToken: string;
  refreshToken?: string;
  expires: number;
  service: TokensServices;
  notice?: string;
}

export type TokensCreationalAttributes = Omit<TokensAttributes, 'id'>;
