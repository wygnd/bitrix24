import { Inject, Injectable } from '@nestjs/common';
import type { BitrixStoragePort } from '@/modules/bitrix/application/ports/storage/storage.port';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { WinstonLogger } from '@/config/winston.logger';
import { IBitrixFolderListRequest } from '@/modules/bitrix/application/interfaces/storage/storage-folder.interface';

@Injectable()
export class BitrixStorageUseCase {
  private readonly logger = new WinstonLogger(
    BitrixStorageUseCase.name,
    'bitrix:storage'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.STORAGE.STORAGE_DEFAULT)
    private readonly bitrixStorage: BitrixStoragePort,
  ) {}

  async uploadFile(url: string) {
    return this.bitrixStorage.uploadFileByUrl(url);
  }

  async getFolderList(fields: IBitrixFolderListRequest = {}) {
    return this.bitrixStorage.getFolderList(fields);
  }
}
