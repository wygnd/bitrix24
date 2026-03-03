import { BitrixStoragePort } from '@/modules/bitrix/application/ports/storage/storage.port';
import { WinstonLogger } from '@/config/winston.logger';
import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import { maybeCatchError } from '@/common/utils/catch-error';
import {
  IBitrixUploadFileRequest,
  IBitrixUploadFileResponse,
} from '@/modules/bitrix/application/interfaces/storage/storage-upload-file.interface';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class BitrixStorageAdapter implements BitrixStoragePort {
  private readonly logger = new WinstonLogger(
    BitrixStorageAdapter.name,
    'bitrix:storage'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    private readonly http: HttpService,
  ) {}

  public async uploadFileByUrl(url: string, folderId: string = '488') {
    try {
      const { uploadUrl, field } = await this.uploadFile({
        id: folderId,
      });

      const formData = new FormData();
      formData.append(field, url);

      return await this.http.axiosRef.post(uploadUrl, formData, {
        baseURL: '',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      this.logger.error({
        handler: this.uploadFileByUrl.name,
        request: {
          url,
          folderId,
        },
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Send request to bitrix for upload file
   * @private
   * @param fields
   */
  private async uploadFile(fields: IBitrixUploadFileRequest) {
    try {
      const { result } = await this.bitrixService.callMethod<
        any,
        IBitrixUploadFileResponse
      >('disk.folder.uploadfile', fields);

      return result;
    } catch (error) {
      this.logger.error({
        handler: this.uploadFile.name,
        request: fields,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }
}
