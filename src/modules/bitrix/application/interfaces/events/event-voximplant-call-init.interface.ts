import { B24CallType } from '@/modules/bitrix/interfaces/bitrix-call.interface';

export interface B24VoxImplantCallInitDataOptions {
  CALL_ID: string;
  CALL_TYPE: B24CallType;
  CALLER_ID: string;
  REST_APP_ID: string;
}
