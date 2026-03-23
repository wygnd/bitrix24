export interface IYandexDirectAccountManagementInvoiceRequest {
  method: string;
  finance_token: string;
  operation_num: number;
  param: {
    Action: string;
    Payments: IYandexDirectAccountManagementGetPaymentOptions[];
  };
}

export interface IYandexDirectAccountManagementGetPaymentOptions {
  AccountID: number;
  Amount: number;
  Currency: string;
}

export interface IYandexDirectGenerateNumberByLoginRequest {
  login: string;
  with_file?: boolean;
}
