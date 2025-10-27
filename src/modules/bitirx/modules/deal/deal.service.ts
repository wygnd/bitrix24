import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { B24CreateDeal, B24Deal, B24DealListParams } from './deal.interface';
import { B24ListParams } from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24User } from '@/modules/bitirx/modules/user/user.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';

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

  async getDeal(fields: B24DealListParams) {
    return this.bitrixService.callMethod<B24DealListParams, B24Deal[]>(
      'crm.deal.list',
      fields,
    );
  }

  async createDeal(fields: Partial<B24Deal>, options?: object) {
    return this.bitrixService.callMethod<B24CreateDeal, number>(
      'crm.deal.add',
      {
        fields: fields,
        options: options,
      },
    );
  }
}
