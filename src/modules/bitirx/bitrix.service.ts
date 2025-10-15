import { Inject, Injectable } from '@nestjs/common';
import type { B24Hook, Result } from '@bitrix24/b24jssdk';
import {
  B24AvailableMethods,
  B24Response,
} from './interfaces/bitrix.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BitrixService {
  private readonly bitrixAuthUrl: string;

  constructor(
    @Inject('BITRIX24')
    private readonly bx24: B24Hook,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const bitrixConfig = configService.get<string>('bitrixConfig');

    if (!bitrixConfig) throw new Error('Invalid bitrix config');
  }

  async call<T = Record<string, any>, K = any>(
    method: B24AvailableMethods,
    params?: T,
  ): Promise<B24Response<K>> {
    const result = await this.bx24.callMethod(method, { ...params });
    return result.getData() as B24Response<K>;
  }

  async callTest<T = Record<string, any>, K = any>(
    method: B24AvailableMethods,
    params?: T,
  ) {
    return await this.callMethod(method, { ...params });
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

  // todo
  private async callMethod(method: string, params: any = {}) {}

  // todo
  private async refreshAccessToken() {}
}
