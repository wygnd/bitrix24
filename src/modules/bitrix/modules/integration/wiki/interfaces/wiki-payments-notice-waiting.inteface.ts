export interface B24WikiPaymentsNoticeWaitingOptions {
  user_bitrix_id: string;
  name_of_org: string;
  deal_id?: string;
  lead_id?: string;
  request: B24WikiPaymentsNoticeWaitingRequestOptions;
  message: string;
}

export interface B24WikiPaymentsNoticeWaitingRequestOptions {
  user_role: string;
  lead_id?: string;
}
