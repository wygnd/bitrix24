export interface IMetrikaStatQueryFields {
  ids: string;
  metrics: string;
  date1?: string;
  date2?: string;
  dimensions?: string;
  filters?: string;
  visit_start_ts?: string | number;
  visit_end_ts?: string | number;
  sort?: string;
}

export interface IMetrikaStatDimensionsResponse {
  dimensions: Record<string, any>[];
  metrics: number[];
}

export interface IMetrikaStatUserInfoOptions {
  ymId: string;
  counterId: string;
  url: string;
}