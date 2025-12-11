export interface HeadHunterAuthData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface HeadHunterAuthTokens extends HeadHunterAuthData {
  expires: number;
}
