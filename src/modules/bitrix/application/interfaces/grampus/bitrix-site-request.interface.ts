export interface BitrixGrampusSiteRequestReceive {
  phone: string;
  url: string;
  clientName?: string;
  comment?: string;
  discount?: BitrixGrampusSiteRequestReceiveDiscountOptions;
}

export interface BitrixGrampusSiteRequestReceiveDiscountOptions {
  percent?: string;
  bonus?: string;
}

export interface BitrixGrampusSiteRequestReceiveResponse {
  status: boolean;
  message: string;
}
