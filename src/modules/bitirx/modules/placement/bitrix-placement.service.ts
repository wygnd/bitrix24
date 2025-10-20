import { Inject, Injectable } from '@nestjs/common';
import type { B24Hook } from '@bitrix24/b24jssdk';
import { PlacementBindOptions } from './placement.interface';

@Injectable()
export class BitrixPlacementService {
  constructor(
    @Inject('BITRIX24')
    private readonly bx24: B24Hook,
  ) {}

  // todo: type response
  async bind(params: PlacementBindOptions) {
    return this.bx24
      .callMethod('placement.bind', params)
      .then((result) => result.getData())
      .catch((err) => {
        throw err;
      });
  }
}
