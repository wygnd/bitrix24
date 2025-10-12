import { Inject, Injectable } from '@nestjs/common';
import type { B24Hook, Result } from '@bitrix24/b24jssdk';
import { B24Response } from './interfaces/bitrix.interface';

@Injectable()
export class BitrixService {
  constructor(
    @Inject('BITRIX24')
    private readonly bx24: B24Hook,
  ) {}

  async call<T = any>(
    method: string,
    params?: Record<string, any>,
  ): Promise<B24Response<T>> {
    const result = await this.bx24.callMethod(method, { ...params });
    return result.getData() as B24Response<T>;
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
