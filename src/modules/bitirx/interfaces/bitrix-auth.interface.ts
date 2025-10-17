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
  scope: 'app';
  domain: 'oauth.bitrix24.tech';
  server_endpoint: 'https://oauth.bitrix24.tech/rest/';
  status: 'L';
  client_endpoint: 'https://grampus.bitrix24.ru/rest/';
  member_id: 'd8736bfdcfe17dd4bbca56b884a97865';
  user_id: 460;
  refresh_token: '7d3f1969007d02d20018815e000001cc00000750e6df30fe38c08a31936722867b650b';
}
