import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { B24Deal } from './deal.interface';
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

  async getDeal(fields: B24ListParams<Partial<B24Deal>>) {
    return this.bitrixService.callMethod<
      B24ListParams<Partial<B24Deal>>,
      B24Deal[]
    >('crm.deal.list', fields);
  }
}
