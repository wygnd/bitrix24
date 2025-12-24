export type WikiOldActions = 'gft_log_user_money';

export interface WikiNotifyReceivePaymentOptions {
  action: WikiOldActions;
  money: string;
  deal_number: string;
  bitrix_user_id: string;
  user_name: string;
  direction: string;
  INN: string;
  budget: boolean;
  payment_type: string;
  date: string;
}
