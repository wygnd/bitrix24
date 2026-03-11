import { B24_WIKI_PAYMENTS_ROLES_CHAT_IDS } from '@/modules/bitrix/application/constants/wiki/wiki-payments.constants';

export interface ImbotKeyboardPaymentsNoticeWaiting {
  message: Buffer<ArrayBuffer>;
  dialogId: string;
  organizationName: string;
  dealId?: string;
  isBudget: boolean;
  userId: string;
  userRole: keyof typeof B24_WIKI_PAYMENTS_ROLES_CHAT_IDS;
}
