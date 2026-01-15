import { WikiOldActions } from '@/modules/wiki/interfaces/wiki.interface';

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
