import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '../../constants/ports/constant';
import type { IB24Port } from '../ports/port';
import { IB24AvailableMethods } from '../../../interfaces/api/interface';

@Injectable()
export class B24UseCase {
  constructor(
    @Inject(B24PORTS.BITRIX_DEFAULT) private readonly bitrix: IB24Port,
  ) {}

  public async callMethod<
    T extends Record<string, any> = Record<string, any>,
    R = any,
  >(method: IB24AvailableMethods, params: Partial<T> = {}) {
    return this.bitrix.callMethod<T, R>(method, params);
  }
}
