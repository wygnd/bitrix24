import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { B24Deal } from './deal.interface';

@Injectable()
export class BitrixDealService {
  constructor(private readonly bitrixService: BitrixService) {}

  async getDealById(dealId: number | string) {
    return this.bitrixService.callMethod<{ id: string | number }, B24Deal>(
      'crm.deal.get',
      {
        id: dealId,
      },
    );
  }
}
