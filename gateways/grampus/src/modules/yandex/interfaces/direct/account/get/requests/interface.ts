export interface IYandexDirectAccountManagementGetRequest {
  method: string;
  param: {
    Action: string;
    SelectionCriteria: {
      Logins?: string[];
      AccountIDS?: number[];
    };
  };
}
