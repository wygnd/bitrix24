import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixDealsPort } from '@/modules/bitrix/application/ports/deals.port';
import {
  B24Deal,
  B24DealListParams,
} from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import { B24ActionType } from '@/modules/bitrix/interfaces/bitrix.interface';

@Injectable()
export class BitrixDealsUseCase {
  constructor(
    @Inject(B24PORTS.DEALS.DEALS_DEFAULT)
    private readonly deals: BitrixDealsPort,
  ) {}

  async getDeals(fields?: B24DealListParams) {
    return this.deals.getDeals(fields);
  }

  async getDealById(dealId: string, action: B24ActionType = 'cache') {
    return this.deals.getDealById(dealId, action);
  }

  async getDealFields() {
    return this.deals.getDealFields();
  }

  async getDealField(fieldId: string) {
    return this.deals.getDealField(fieldId);
  }

  async createDeal(fields: Partial<B24Deal>) {
    return this.deals.createDeal(fields);
  }
}
