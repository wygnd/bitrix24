export interface IBitrixUploadFileRequest {
  id: string | number;
  data?: Record<'NAME', string>;
  fileContent?: string[];
  rights?: IBitrixUploadFileRequestRights;
  generateUniqueName?: boolean;
}

export interface IBitrixUploadFileRequestRights {
  ID: string;
  NAME: string;
  TITLE: string;
}

export interface IBitrixUploadFileResponse {
  field: string;
  uploadUrl: string;
}
