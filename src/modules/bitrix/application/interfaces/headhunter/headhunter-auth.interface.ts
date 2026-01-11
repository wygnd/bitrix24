export interface HeadHunterAuthData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface HeadHunterAuthTokens extends Omit<
  HeadHunterAuthData,
  'expires_in'
> {
  expires: number;
}
