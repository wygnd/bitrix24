import { B24LeadUpsellDto } from '@/modules/bitrix/application/dtos/leads/lead-upsell.dto';
import {
  B24LeadUpsellAttributes,
  B24LeadUpsellCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/leads/lead-upsell.interface';
import { FindOptions } from 'sequelize';

export interface BitrixLeadsUpsellRepositoryPort {
  addUpsell(
    fields: B24LeadUpsellCreationalAttributes,
  ): Promise<B24LeadUpsellDto | null>;
  updateUpsell(
    upsellId: number,
    fields: Partial<B24LeadUpsellAttributes>,
  ): Promise<boolean>;
  getUpsells(
    options?: FindOptions<B24LeadUpsellAttributes>,
  ): Promise<B24LeadUpsellDto[]>;
}
