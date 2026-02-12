export interface BitrixWikiMessage {
  chat_id: string;
  message: string;
}

export interface BitrixWikiMessageResponse {
  status: boolean;
  message: string;
  message_id: number | null;
}
