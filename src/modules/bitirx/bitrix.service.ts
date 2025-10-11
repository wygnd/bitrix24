import { Inject, Injectable } from '@nestjs/common';
import type { B24Hook } from '@bitrix24/b24jssdk';

@Injectable()
export class BitrixService {
  constructor(
    @Inject('BITRIX24')
    private readonly bx24: B24Hook,
  ) {}

  async call(method: string, params?: Record<string, any>) {
    const result = await this.bx24.callMethod(method, { ...params });
    return result.getData();
  }

  async callBatch(commands: any[] | object, halt = false) {
    return await this.bx24.callBatch(commands, halt);
  }
}
