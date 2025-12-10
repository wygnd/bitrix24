export interface WebhookUserItem {
  userId: string;
  name: string;
}

export type WebhookUserData = Record<number, WebhookUserItem[]>;
