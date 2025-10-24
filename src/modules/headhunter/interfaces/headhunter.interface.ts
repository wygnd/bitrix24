export interface HeadHunterAuthOptions {
  grant_type: string;
  client_id: string;
  client_secret: string;
}

export interface HeadHunterAuthResponse {
  access_token: string;
  token_type: string;
}
