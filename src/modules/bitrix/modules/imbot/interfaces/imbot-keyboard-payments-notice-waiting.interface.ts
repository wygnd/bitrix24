export interface ImbotKeyboardPaymentsNoticeWaiting {
  message: Buffer<ArrayBuffer>;
  dialogId: string;
  organizationName: string;
  dealId?: string;
  isBudget: boolean;
  userId: string;
}
