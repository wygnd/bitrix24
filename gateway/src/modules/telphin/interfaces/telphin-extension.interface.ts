export interface TelphinExtensionItem {
  id: number;
  name: string;
  domain: string;
  type: string;
  status: string;
  label: string;
  client_id: number;
  extension_group_id: number;
  extra_params: string;
  dial_rule_limit: number | null;
  caller_id_name: string;
  rfc_public_caller_id_number: boolean;
  create_date: string;
  did_as_transfer_caller_id: number | null;
  dial_rule_id: number | null;
  ani_rfc3325: boolean;
  message_did: string;
  ani: string;
  client_public_caller_id_number: number | null;
  caller_id_group_id: number | null;
  caller_id_group_method: string;
}

export interface TelphinExtensionItemExtraParams {
  comment: string;
  name: string;
  phone_work: string;
  tg_id: string;
  tg_active: string;
  phone_home: string;
  tg_user: string;
}
