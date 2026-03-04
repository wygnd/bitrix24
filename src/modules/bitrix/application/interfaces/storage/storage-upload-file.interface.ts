export interface IBitrixUploadFileRequest {
  id: number;
  data: {
    NAME: string;
  };
  fileContent?: string[];
  rights?: IBitrixUploadFileRequestRights;
  generateUniqueName?: 'Y' | 'N';
}

export interface IBitrixUploadFileRequestRights {
  ID: string;
  NAME: string;
  TITLE: string;
}

export interface IBitrixUploadFileResponse {
  ID: number;
  NAME: string;
  CODE: any | null;
  STORAGE_ID: string;
  TYPE: string;
  PARENT_ID: string;
  DELETED_TYPE: number;
  GLOBAL_CONTENT_VERSION: number;
  FILE_ID: number;
  SIZE: string;
  CREATE_TIME: string;
  UPDATE_TIME: string;
  DELETE_TIME: string | null;
  CREATED_BY: string;
  UPDATED_BY: string;
  DELETED_BY: string | null;
  DOWNLOAD_URL: string;
  DETAIL_URL: string;
}

export interface IBitrixStorageFolderResponse {
  ID: string;
  NAME: string;
  CODE: string;
  STORAGE_ID: string;
  TYPE: string;
  REAL_OBJECT_ID: string;
  PARENT_ID: string;
  DELETED_TYPE: string;
  CREATE_TIME: string;
  UPDATE_TIME: string;
  DELETE_TIME: string;
  CREATED_BY: string;
  UPDATED_BY: string;
  DELETED_BY: string;
  DETAIL_URL: string;
}

export interface IBitrixStorageResponse {
  ID: string;
  NAME: string;
  CODE: string;
  MODULE_ID: string;
  ENTITY_TYPE: string;
  ENTITY_ID: string;
  ROOT_OBJECT_ID: string;
}
