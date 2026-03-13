export interface IBitrixAuthTokens {
  access_token: string;
  refresh_token: string;
  expires: number;
}

export interface IBitrixAuthResponse {
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

export interface IBitrixAuthSecrets {
  clientId: string;
  clientSecret: string;
}

export interface IB24AuthOptions {
  access_token: string;
  expires: number;
  expires_in: number;
  scope: string;
  domain: string;
  server_endpoint: string;
  status: string;
  client_endpoint: string;
  member_id: string;
  user_id: number;
  refresh_token: string;
  application_token: string;
}