export interface IB24CRMDuplicateRequest {
  type: 'EMAIL' | 'PHONE';
  entity_type: 'LEAD' | 'CONTACT' | 'COMPANY';
  values: string[];
}
