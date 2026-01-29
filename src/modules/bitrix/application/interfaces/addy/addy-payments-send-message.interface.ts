export interface BitrixAddyPaymentsSendMessagePaymentOptions {
  user_id: string;
  link: string;
  price: number;
  contract: string;
  client: string;
}

export interface BitrixAddyPaymentsSendMessageResponse {
  status: boolean;
  message: string;
}

export type BitrixAddyPaymentsSendMessageType = 'payment' | 'notice';

export interface BitrixAddyPaymentsSendMessageQuery {
  type: BitrixAddyPaymentsSendMessageType;
}
export interface BitrixAddyPaymentsSendMessageNoticeOptions {
  message: string;
}