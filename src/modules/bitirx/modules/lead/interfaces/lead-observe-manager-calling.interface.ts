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
  dateCalling: Date;
}

export interface LeadObserveManagerCallingResponse {
  status: boolean;
  message: string;
  data?: {
    updatedLeads: string[];
    missingLeads: string[];
    notifiedLeads: string[];
    deletedLeads: string[];
  };
  total?: {
    updatedLeads: number;
    missingLeads: number;
    notifiedLeads: number;
    deletedLeads: number;
    uniqueLeads: number;
  };
}
