export interface TokensAttributes {
  id: number;
  accessToken: string;
  refreshToken: string;
  expires: number;
  expiresAt: number;
}

export type TokensCreationalAttributes = Pick<TokensAttributes, 'id'>;
