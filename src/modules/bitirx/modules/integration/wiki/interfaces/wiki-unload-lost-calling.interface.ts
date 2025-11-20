export interface UnloadLostCallingResponse {
  leadId: string;
  phone: string;
  status: 'new' | 'exists' | 'not-created';
}
