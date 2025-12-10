export interface HeadHunterAuthData {
  access_token: string;
  refresh_token: string;
}

export interface HeadHunterAuthTokens extends HeadHunterAuthData {
  expires: number;
}
