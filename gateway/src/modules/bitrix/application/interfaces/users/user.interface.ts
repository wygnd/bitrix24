import {
  B24FilterOptions,
  B24ListOrder,
  B24ListParams,
  B24SelectOptions,
} from '../../../interfaces/bitrix.interface';

export interface B24User {
  ID: string;
  XML_ID: string;
  ACTIVE: boolean;
  NAME: string;
  LAST_NAME: string;
  SECOND_NAME: string;
  EMAIL: string;
  LAST_LOGIN: string;
  DATE_REGISTER: string;
  TIME_ZONE: string;
  IS_ONLINE: string;
  TIMESTAMP_X: object;
  LAST_ACTIVITY_DATE: object;
  PERSONAL_GENDER: string;
  PERSONAL_WWW: string;
  PERSONAL_BIRTHDAY: string;
  PERSONAL_MOBILE: string[];
  PERSONAL_CITY: string;
  WORK_PHONE: string;
  WORK_POSITION: string;
  UF_EMPLOYMENT_DATE: string;
  UF_DEPARTMENT: number[];
  USER_TYPE: string;
}

export type B24UserFilterOptions = B24FilterOptions<B24User>;

export type B24UserOrderOptions = {
  [K in keyof B24User]?: B24ListOrder;
};

export type B24UserSelectOptions = B24SelectOptions<B24User>;

export type B24UserListParams = B24ListParams<
  B24UserFilterOptions,
  B24UserOrderOptions,
  B24UserSelectOptions
>;

export interface B24MinWorkflowUserOptions {
  userId: string;
  countLeads: number;
}
