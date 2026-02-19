export interface IMetrikaStatQueryFields {
  ids: string;
  metrics: string;
  date1: string;
  date2: string;
  dimensions?: string;
  filters?: string;
}

export interface IMetrikaStatDimensionsResponse {
  dimensions: Record<string, any>;
  metrics: number[];
}
