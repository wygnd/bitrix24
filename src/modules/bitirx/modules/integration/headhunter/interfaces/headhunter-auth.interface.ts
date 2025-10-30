export interface HeadHunterAuthData {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
}

export interface HeadHunterAuthTokens extends HeadHunterAuthData {
  expires: number;
}
