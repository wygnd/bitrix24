export interface BitrixStoragePort {
  uploadFileByUrl(url: string, folderId?: string): void;
}
