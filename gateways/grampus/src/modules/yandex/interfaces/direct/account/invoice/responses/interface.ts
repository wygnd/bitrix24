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
