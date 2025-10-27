import { BoolString, ISODate } from '@bitrix24/b24jssdk';
import { B24ListParams } from '@/modules/bitirx/interfaces/bitrix.interface';

export interface B24Deal extends Record<string, any> {
  ID: string;
  TITLE: string;
  TYPE_ID: string;
  STAGE_ID: string;
  PROBABILITY: string;
  CURRENCY_ID: string;
  OPPORTUNITY: string;
  IS_MANUAL_OPPORTUNITY: 'Y';
  TAX_VALUE: string;
  LEAD_ID: string;
  COMPANY_ID: string;
  CONTACT_ID: string;
  QUOTE_ID: string;
  BEGINDATE: ISODate;
  CLOSEDATE: ISODate;
  ASSIGNED_BY_ID: string | number;
  CREATED_BY_ID: string;
  MODIFY_BY_ID: string;
  DATE_CREATE: ISODate;
  DATE_MODIFY: ISODate;
  OPENED: BoolString;
  CLOSED: BoolString;
  COMMENTS: string;
  ADDITIONAL_INFO: string;
  LOCATION_ID: string | null;
  CATEGORY_ID: string;
  STAGE_SEMANTIC_ID: string;
  IS_NEW: BoolString;
  IS_RECURRING: BoolString;
  IS_RETURN_CUSTOMER: BoolString;
  IS_REPEATED_APPROACH: BoolString;
  SOURCE_ID: string;
  SOURCE_DESCRIPTION: string;
  ORIGINATOR_ID: string | null;
  ORIGIN_ID: string | null;
  MOVED_BY_ID: string;
  MOVED_TIME: ISODate;
  LAST_ACTIVITY_TIME: ISODate;
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
