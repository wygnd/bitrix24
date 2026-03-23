export interface IWikiReceivedPaymentRequestOptions {
  bitrix_user_id: string;
  deal_number: string;
  amount: string;
  payment_type: 'spb' | 'rs';
  inn?: string;
  fio?: string;
  invoice: string;
  file_id: string;
  is_auto: boolean;
}
