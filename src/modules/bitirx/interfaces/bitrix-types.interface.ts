export interface B24CRMMultifield {
  ID: string;
  TYPE_ID: B24CRMMultifieldTypeIds;
  VALUE: string;
  VALUE_TYPE: string;
}

export type B24CRMMultifieldTypeIds = 'PHONE' | 'EMAIL' | 'WEB' | 'IM' | 'LINK';
