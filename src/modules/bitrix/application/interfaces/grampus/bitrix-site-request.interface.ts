export interface BitrixGrampusSiteRequestReceive {
  phone: string;
  url: string;
  clientName?: string;
  comment?: string;
}

export interface BitrixGrampusSiteRequestReceiveResponse {
  status: boolean;
  message: string;
}
