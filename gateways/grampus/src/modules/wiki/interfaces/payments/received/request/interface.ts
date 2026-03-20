export interface IWikiReceivedPaymentRequestOptions {
  user_id: string;
  deal_number: string;
  amount: string;
  invoice: string;
  payment_type: string;
  inn?: string;
  fio: string;
}
