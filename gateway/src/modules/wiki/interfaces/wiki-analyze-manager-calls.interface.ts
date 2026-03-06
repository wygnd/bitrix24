export interface IWikiAnalyzeManagerCallsRequest {
  post_id: number;
  lead_id: number;
  transcribe: string;
  source_map: Record<string, any>;
}
