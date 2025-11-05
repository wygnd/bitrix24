import { B24ListParams } from '@/modules/bitirx/interfaces/bitrix.interface';

export interface B24Deal extends Record<string, any> {
  ID: string;
  TITLE: string;
  TYPE_ID: string;
  STAGE_ID: string;
  PROBABILITY: string;
  CURRENCY_ID: string;
  OPPORTUNITY: string;
  IS_MANUAL_OPPORTUNITY: string;
  TAX_VALUE: string;
  LEAD_ID: string;
  COMPANY_ID: string;
  CONTACT_ID: string;
  QUOTE_ID: string;
  BEGINDATE: string;
  CLOSEDATE: string;
  ASSIGNED_BY_ID: string | number;
  CREATED_BY_ID: string;
  MODIFY_BY_ID: string;
  DATE_CREATE: string;
  DATE_MODIFY: string;
  OPENED: string;
  CLOSED: string;
  COMMENTS: string;
  ADDITIONAL_INFO: string;
  LOCATION_ID: string | null;
  CATEGORY_ID: string;
  STAGE_SEMANTIC_ID: string;
  IS_NEW: string;
  IS_RECURRING: string;
  IS_RETURN_CUSTOMER: string;
  IS_REPEATED_APPROACH: string;
  SOURCE_ID: string;
  SOURCE_DESCRIPTION: string;
  ORIGINATOR_ID: string | null;
  ORIGIN_ID: string | null;
  MOVED_BY_ID: string;
  MOVED_TIME: string;
  LAST_ACTIVITY_TIME: string;
  UTM_SOURCE: string;
  UTM_MEDIUM: string;
  UTM_CAMPAIGN: null | string;
  UTM_CONTENT: null | string;
  UTM_TERM: null | string;
  PARENT_ID_1220: string;
  LAST_ACTIVITY_BY: string;
}

export type B24DealListParams = B24ListParams<Partial<B24Deal>>;

export interface B24CreateDeal {
  fields: Partial<B24Deal>;
  options?: object;
}

export interface B24DealField {
  type: string;
  isRequired: boolean;
  isReadOnly: boolean;
  isImmutable: boolean;
  isMultiple: boolean;
  isDynamic: boolean;
  statusType: string;
  title: string;
}

export interface B24DealUserField {
  listLabel: string;
  formLabel: string;
  filterLabel: string;
  settings: Record<string, any>;
  items?: B24DealFieldItem[];
}

interface B24DealFieldItem {
  ID: string;
  VALUE: string;
}

export type B24DealFields = {
  [k in keyof B24Deal]: B24DealField & B24DealUserField;
};
