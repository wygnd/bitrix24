export interface TelphinUserInfo {
  id: number;
  login: string;
  admin: boolean;
  dealer_id: number | null;
  client_id: number;
  extension_group_id: number | null;
  extension_id: number | null;
  timezone: string;
  access: string;
  extra_params: null;
}
