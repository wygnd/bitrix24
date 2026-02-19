export class IMetrikaResponse<T extends Record<string, any>> {
  query: Record<string, any>;
  data: T;
  total_rows: number;
  sampled: boolean;
  contains_sensitive_data: boolean;
  sample_share: number;
  sample_size: number;
  sample_space: number;
  data_lag: number;
  totals: number[];
  min: number[];
  max: number[];
}
