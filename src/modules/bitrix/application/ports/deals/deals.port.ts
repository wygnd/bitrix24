import {
  B24Deal,
  B24DealField,
  B24DealFields,
  B24DealListParams,
  B24DealUserField,
} from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import {
  B24ActionType,
  B24Response,
} from '@/modules/bitrix/interfaces/bitrix.interface';

export interface BitrixDealsPort {
  getDealById(
    dealId: number | string,
    action?: B24ActionType,
  ): Promise<B24Deal | null>;
  getDeals(
    fields?: B24DealListParams,
    action?: B24ActionType,
  ): Promise<B24Response<B24Deal[]>>;
  createDeal(fields: Partial<B24Deal>, options?: object): Promise<number>;
  getDealFields(): Promise<B24DealFields | null>;
  getDealField(
    fieldId: string,
  ): Promise<(B24DealField & B24DealUserField) | null>;
  updateDeal(dealId: string, fields: Partial<B24Deal>): Promise<boolean>;
  getDuplicateDealsByPhone(phone: string): Promise<B24Deal[]>;
}
