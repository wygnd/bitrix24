export interface ImbotKeyboardDefineUnknownPaymentOptions {
  type: 'grampus' | 'addy';
  group: string;
  paymentId: string;
  message: Buffer<ArrayBuffer>;
}
