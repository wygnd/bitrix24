export interface WebhookUserItem {
  userId: string;
  name: string;
  seoToken?: 'pm' | 'tec';
}

export type WebhookUserData = Record<number, WebhookUserItem[]>;
