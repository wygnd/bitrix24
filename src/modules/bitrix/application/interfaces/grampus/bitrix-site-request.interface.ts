export interface BitrixGrampusSiteRequestReceive {
  phone: string;
  url: string;
  clientName?: string;
  comment?: string;
  extraParams?: string;
}

export interface BitrixGrampusSiteRequestReceiveExtraParamsFieldsDiscount {
  percent?: string;
  bonus?: string;
}

export interface BitrixGrampusSiteRequestReceiveResponse {
  status: boolean;
  message: string;
}

export interface BitrixGrampusSiteRequestReceiveExtraParamsDiscountOptions {
  type: 'discount';
  fields: BitrixGrampusSiteRequestReceiveExtraParamsFieldsDiscount;
}

export interface BitrixGrampusSiteRequestReceiveExtraParamsCalculatorOptions {
  type: 'calculator';
  fields: any;
}

export interface BitrixGrampusSiteRequestReceiveExtraParamsFieldsVacancy {
  vacancy: string;
}

export interface BitrixGrampusSiteRequestReceiveExtraParamsVacancyOptions {
  type: 'vacancy';
  fields: BitrixGrampusSiteRequestReceiveExtraParamsFieldsVacancy;
}

export type BitrixGrampusSiteRequestReceiveExtraParamsOptions =
  | BitrixGrampusSiteRequestReceiveExtraParamsDiscountOptions
  | BitrixGrampusSiteRequestReceiveExtraParamsCalculatorOptions;
