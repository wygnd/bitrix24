import { IBitrixFolderListRequest } from '@/modules/bitrix/application/interfaces/storage/storage-folder.interface';
import {
  IBitrixStorageFolderResponse,
  IBitrixStorageResponse,
  IBitrixUploadFileResponse,
} from '@/modules/bitrix/application/interfaces/storage/storage-upload-file.interface';

export interface BitrixStoragePort {
  uploadFileByUrl(
    url: string,
    folderId?: string,
  ): Promise<IBitrixUploadFileResponse>;
  getFolderList(
    fields?: IBitrixFolderListRequest,
  ): Promise<IBitrixStorageFolderResponse[] | IBitrixStorageResponse[]>;
}
