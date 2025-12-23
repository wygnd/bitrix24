import {
  B24CallFailedCode,
  B24CallType,
} from '@/modules/bitrix/interfaces/bitrix-call.interface';

export interface B24VoxImplantCallEndDataOptions {
  CALL_ID: string;
  CALL_TYPE: B24CallType;
  PHONE_NUMBER: string;
  PORTAL_NUMBER: string;
  PORTAL_USER_ID: string;
  CALL_DURATION: string;
  CALL_START_DATE: string;
  COST: string;
  COST_CURRENCY: string;
  CALL_FAILED_CODE: B24CallFailedCode;
  CALL_FAILED_REASON: string;
  CRM_ACTIVITY_ID: string;
}
