export interface BitrixTokens {
  access_token: string;
  refresh_token: string;
  expires: number;
}

export interface BitrixOauthOptions {
  grant_type: string;
  refresh_token: string;
  client_secret: string;
  client_id: string;
}

export interface BitrixOauthResponse {
  access_token: string;
  expires: number;
  expires_in: 3600;
  scope: string;
  domain: string;
  server_endpoint: string;
  status: string;
  client_endpoint: string;
  member_id: string;
  user_id: number;
  refresh_token: string;
}
