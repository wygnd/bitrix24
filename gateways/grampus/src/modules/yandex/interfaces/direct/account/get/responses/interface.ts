export interface IYandexDirectAccountManagementGetResponse {
  data: {
    ActionsResult: [];
    Accounts: IYandexDirectAccountManagementAccountOptions[];
  };
}

export interface IYandexDirectAccountManagementAccountOptions {
  AmountAvailableForTransfer: string;
  AccountID: number;
  EmailNotification: {
    MoneyWarningValue: number;
    PausedByDayBudget: string;
    Email: string;
  };
  Currency: string;
  Login: string;
  Amount: string;
  SmsNotification: {
    MoneyOutSms: string;
    PausedByDayBudgetSms: string;
    SmsTimeFrom: string;
    MoneyInSms: string;
    SmsTimeTo: string;
  };
  AccountDayBudget: null;
  AgencyName: string;
}
