import { Inject, Injectable } from '@nestjs/common';
import { LEAD_OBSERVE_MANAGER_REPOSITORY } from '@/modules/bitirx/modules/lead/constants/lead.constants';
import { LeadObserveManagerCallingModel } from '@/modules/bitirx/modules/lead/entities/lead-observe-manager-calling.entity';
import {
  LeadObserveManagerCallingAttributes,
  LeadObserveManagerCallingCreationalAttributes,
} from '@/modules/bitirx/modules/lead/interfaces/lead-observe-manager-calling.interface';
import { BulkCreateOptions, FindOptions, Op } from 'sequelize';

@Injectable()
export class BitrixLeadObserveManagerCallingService {
  constructor(
    @Inject(LEAD_OBSERVE_MANAGER_REPOSITORY)
    private readonly leadObserveManagerCallingRepository: typeof LeadObserveManagerCallingModel,
  ) {}

  async addOrUpdateCallingItems(
    fields: LeadObserveManagerCallingCreationalAttributes[],
    options?: BulkCreateOptions<LeadObserveManagerCallingAttributes>,
  ) {
    return this.leadObserveManagerCallingRepository.bulkCreate(fields, options);
  }

  async getCallingList(
    options?: FindOptions<LeadObserveManagerCallingAttributes>,
  ) {
    return this.leadObserveManagerCallingRepository.findAll(options);
  }

  async removeCallingItems<T>(fieldName: string, items: T[]) {
    return this.leadObserveManagerCallingRepository.destroy({
      where: {
        [fieldName]: {
          [Op.in]: items,
        },
      },
    });
  }
}
