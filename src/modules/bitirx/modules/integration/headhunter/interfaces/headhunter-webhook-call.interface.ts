export interface HeadhunterWebhookCallInterface<T> {
  id: string;
  payload: T;
  subscription_id: string;
  action_type: string;
  user_id: string;
}

export interface HeadhunterWebhookCallResponse {
  status: boolean;
  message: string;
}