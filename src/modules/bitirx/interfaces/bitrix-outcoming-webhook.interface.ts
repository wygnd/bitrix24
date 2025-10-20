export interface B24OutcomingWebhook {
  document_id: string[];
  auth: B24OutcomingWebhookAuth;
}

export interface B24OutcomingWebhookAuth {
  domain: string;
  client_endpoint: string;
  server_endpoint: string;
  member_id: string;
}