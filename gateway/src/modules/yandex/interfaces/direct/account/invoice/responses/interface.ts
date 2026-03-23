export interface IYandexDirectAccountManagementInvoiceResponse {
  data: {
    ActionsResult: IYandexDirectAccountManagementInvoiceActionsResultOptions[];
  };
}

export interface IYandexDirectAccountManagementInvoiceActionsResultOptions {
  URL: string;
  Errors?: IYandexDirectAccountManagementInvoiceActionsResultErrorOptions[];
}

interface IYandexDirectAccountManagementInvoiceActionsResultErrorOptions {
  FaultCode: number;
  FaultString: string;
  FaultDetail: string;
}

export interface IYandexDirectGenerateNumberByLoginResponse {
  invoice_number: string;
  file_data: string | null;
}
