export interface TelphinExternalPhone {
  id: number;
  name: string;
  domain: string | null;
  client_id: number;
  extension_id: number;
  comment: string;
  create_date: string;
  allow_message: boolean;
  message_extension_id: number;
}
