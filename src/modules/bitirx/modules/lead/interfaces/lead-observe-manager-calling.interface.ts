export interface LeadObserveManagerCallingAttributes {
  id: number;
  phone: string;
  leadId: string;
  dateCalling: Date;
}

export type LeadObserveManagerCallingCreationalAttributes = Omit<
  LeadObserveManagerCallingAttributes,
  'id'
>;

export interface LeadObserveManagerCallingLeadBitrixItem {
  id: string;
  phone: string;
  status: string;
  assigned: string;
}
