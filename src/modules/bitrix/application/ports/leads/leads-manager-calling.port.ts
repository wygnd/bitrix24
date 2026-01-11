import { BulkCreateOptions, FindOptions } from 'sequelize';
import {
  LeadObserveManagerCallingAttributes,
  LeadObserveManagerCallingCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/leads/lead-observe-manager-calling.interface';
import { LeadManagerCallDTO } from '@/modules/bitrix/application/dtos/leads/lead-manager-calling.dto';

export interface BitrixLeadsManagerCallingRepositoryPort {
  getCallList(
    options?: FindOptions<LeadObserveManagerCallingAttributes>,
  ): Promise<LeadManagerCallDTO[]>;
  addOrUpdateCalls(
    fields: LeadObserveManagerCallingCreationalAttributes[],
    options?: BulkCreateOptions<LeadObserveManagerCallingAttributes>,
  ): Promise<LeadManagerCallDTO[]>;
  removeCallItems<T>(
    fieldName: keyof LeadObserveManagerCallingAttributes,
    items: T[],
  ): Promise<number>;
}
