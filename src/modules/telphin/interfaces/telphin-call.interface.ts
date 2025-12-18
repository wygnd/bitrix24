export interface TelphinCallItem {
  answer_time_gmt: string;
  call_api_id: string;
  call_flow: string;
  called_did: number | null;
  called_extension: {
    name: string;
    id: number;
    client_id: number;
    type: string;
    extension_group_id: number;
  };
  called_number: string;
  caller_extension: {
    name: string;
    id: number;
    client_id: number;
    type: string;
    extension_group_id: number;
  };
  caller_id_name: string;
  caller_id_number: string;
  init_time_gmt: string;
  record_uuid: number | null;
  callback_id: number | null;
  extension_id: number;
  real_call: boolean;
  subcall_id: string;
  call_id: string;
}

export interface TelphinGetCallListResponse {
  call_list: TelphinCallItem[];
}
