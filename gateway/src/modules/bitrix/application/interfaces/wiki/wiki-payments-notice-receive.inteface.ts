export interface B24WikiPaymentsNoticeReceiveOptions {
  message: string;
  group: string;
  payment_id: string;
  maybe_mismatch: boolean;
  is_sbp: boolean;
  bitrix_user_id?: string;
  user_role?: string;
  deal_number?: string;
  yandex_direct_login?: string;
  client_full_name?: string;
}
