export interface UnloadLostCallingItem {
  phone: string;
  datetime: string;
}

export interface UnloadLostCallingResponse {
  leadId: string;
  phone: string;
  status: 'new' | 'exists' | 'not-created' | 'updated';
}
