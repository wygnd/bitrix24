import { BitrixStoragePort } from '@/modules/bitrix/application/ports/storage/storage.port';
import { WinstonLogger } from '@/config/winston.logger';
import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import { maybeCatchError } from '@/common/utils/catch-error';
import {
  IBitrixStorageFolderResponse,
  IBitrixStorageResponse,
  IBitrixUploadFileRequest,
  IBitrixUploadFileResponse,
} from '@/modules/bitrix/application/interfaces/storage/storage-upload-file.interface';
import { HttpService } from '@nestjs/axios';
import { IBitrixFolderListRequest } from '@/modules/bitrix/application/interfaces/storage/storage-folder.interface';
import { B24AvailableMethods } from '@/modules/bitrix/interfaces/bitrix.interface';
import { generateRandomString } from '@/common/utils/generate-random-string';
import { urlToBase64 } from '@/common/utils/url-to-base64';

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

  public async uploadFileByUrl(url: string, folderId: string = '471420') {
    try {
      const filename = url.split('/').reverse()[0];
      return await this.uploadFile({
        id: parseInt(folderId),
        data: {
          NAME: filename,
        },
        fileContent: [filename, await urlToBase64(url)],
        generateUniqueName: 'Y',
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

  public async getFolderList(fields: IBitrixFolderListRequest = {}) {
    try {
      let method: B24AvailableMethods;

      if ('id' in fields) {
        method = 'disk.storage.getchildren';
      } else {
        method = 'disk.storage.getlist';
      }

      const { result } = await this.bitrixService.callMethod<
        IBitrixFolderListRequest,
        IBitrixStorageFolderResponse[] | IBitrixStorageResponse[]
      >(method, fields);

      return result;
    } catch (error) {
      this.logger.error({
        handler: this.getFolderList.name,
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
