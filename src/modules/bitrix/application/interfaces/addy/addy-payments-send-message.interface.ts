export interface BitrixAddyPaymentsSendMessageOptions {
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
