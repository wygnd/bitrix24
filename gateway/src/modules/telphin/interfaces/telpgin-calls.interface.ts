export interface TelphinGetCallsFields {
  start_datetime: string;
  end_datetime: string;
  extension_id?: number[];
  flow?: string[];
}

export interface TelphinCallsResponse {
  page: number;
  per_page: number;
  order: string;
  calls: TelphinCallOptions[];
}

export interface TelphinCallOptions {
  flow: 'out' | 'in';
  init_time_gmt: string;
  start_time_gmt: string;
  bridged_time_gmt: string;
  hangup_time_gmt: string;
  duration: number;
  bridged_duration: number;
  extension_id: number;
  extension_name: string;
  extension_type: 'phone';
  extension_group_owner_id: number;
  client_owner_id: number;
  result:
    | 'busy'
    | 'bridged'
    | 'answered'
    | 'not answered'
    | 'rejected'
    | 'failed';
  from_username: string;
  from_domain: string;
  bridged_username: string;
  bridged_domain: string;
  did_number: null;
  did_domain: null;
  to_username: string;
  to_domain: string;
  from_screen_name: string;
  hangup_cause: string;
  ext_number_reg: null;
  call_uuid: string;
  hangup_disposition:
    | 'callee_bye'
    | 'caller_bye'
    | 'caller_cancel'
    | 'callee_refuse'
    | 'internal_cancel'
    | '';
  diversion_number: string | null;
  callback: string | null;
  quality_rate: object | null;
  ivr_history: string | null;
}
