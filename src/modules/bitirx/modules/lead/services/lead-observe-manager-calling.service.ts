import { Inject, Injectable } from '@nestjs/common';
import { LEAD_OBSERVE_MANAGER_REPOSITORY } from '@/modules/bitirx/modules/lead/constants/lead.constants';
import { LeadObserveManagerCallingModel } from '@/modules/bitirx/modules/lead/entities/lead-observe-manager-calling.entity';
import {
  LeadObserveManagerCallingAttributes,
  LeadObserveManagerCallingCreationalAttributes,
} from '@/modules/bitirx/modules/lead/interfaces/lead-observe-manager-calling.interface';
import { FindOptions } from 'sequelize';

@Injectable()
export class BitrixLeadObserveManagerCallingService {
  constructor(
    @Inject(LEAD_OBSERVE_MANAGER_REPOSITORY)
    private readonly leadObserveManagerCallingRepository: typeof LeadObserveManagerCallingModel,
  ) {}

  async addCalling(fields: LeadObserveManagerCallingCreationalAttributes) {
    return this.leadObserveManagerCallingRepository.create(fields);
  }

  async getCallingList(
    options?: FindOptions<LeadObserveManagerCallingAttributes>,
  ) {
    return this.leadObserveManagerCallingRepository.findAll(options);
  }

  async removeCallingItem(leadId: string) {
    return this.leadObserveManagerCallingRepository.destroy({
      where: {
        leadId: leadId,
      },
    });
  }
}
