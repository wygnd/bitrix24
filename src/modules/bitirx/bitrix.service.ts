import { Inject, Injectable } from '@nestjs/common';
import type { B24Hook, Result } from '@bitrix24/b24jssdk';
import {
  B24AvailableMethods,
  B24Response,
} from './interfaces/bitrix.interface';

@Injectable()
export class BitrixService {
  constructor(
    @Inject('BITRIX24')
    private readonly bx24: B24Hook,
  ) {}

  async call<T = Record<string, any>, K = any>(
    method: B24AvailableMethods,
    params?: T,
  ): Promise<B24Response<K>> {
    const result = await this.bx24.callMethod(method, { ...params });
    return result.getData() as B24Response<K>;
  }

  // todo: handle batch response
  async callBatch(commands: any[] | object, halt = false) {
    const result = await this.bx24.callBatch(commands, halt, true);

    if (!result.isSuccess) {
      console.error(result.getErrors());
      throw new Error('Failed to call batch');
    }

    const response = {};

    for (const [key, value] of Object.entries(result.getData() as object)) {
      response[key] = value.getData() as Result;
    }

    return response;
  }
}
