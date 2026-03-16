export interface IB24AddyIntegrationAddClientPaymentRequest {
  user_email: string;
  payment_time: string;
  method_type: string;
  amount_without_commission: number;
  amount: number;
}
