import { Inject, Injectable } from '@nestjs/common';
import { BitrixLeadsManagerCallingRepositoryPort } from '@/modules/bitrix/application/ports/leads/leads-manager-calling.port';
import {
  LeadObserveManagerCallingAttributes,
  LeadObserveManagerCallingCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/leads/lead-observe-manager-calling.interface';
import { BulkCreateOptions, FindOptions, Op } from 'sequelize';
import { LEAD_OBSERVE_MANAGER_REPOSITORY } from '@/modules/bitrix/application/constants/leads/lead.constants';
import { LeadObserveManagerCallingModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-observe-manager-calling.entity';
import { plainToInstance } from 'class-transformer';
import { LeadManagerCallDTO } from '@/modules/bitrix/application/dtos/leads/lead-manager-calling.dto';

@Injectable()
export class BitrixLeadsMangerCallingRepository implements BitrixLeadsManagerCallingRepositoryPort {
  constructor(
    @Inject(LEAD_OBSERVE_MANAGER_REPOSITORY)
    private readonly leadsManagerCallingRepository: typeof LeadObserveManagerCallingModel,
  ) {}

  async addOrUpdateCalls(
    fields: LeadObserveManagerCallingCreationalAttributes[],
    options?: BulkCreateOptions<LeadObserveManagerCallingAttributes>,
  ) {
    return (
      await this.leadsManagerCallingRepository.bulkCreate(fields, options)
    ).map((r) => this.formDTO(r));
  }

  async getCallList(
    options?: FindOptions<LeadObserveManagerCallingAttributes>,
  ) {
    return (await this.leadsManagerCallingRepository.findAll(options)).map(
      (r) => this.formDTO(r),
    );
  }

  async removeCallItems<T>(fieldName: string, items: T[]) {
    return this.leadsManagerCallingRepository.destroy({
      where: {
        [fieldName]: {
          [Op.in]: items,
        },
      },
    });
  }

  private formDTO(row: LeadObserveManagerCallingModel) {
    return plainToInstance(LeadManagerCallDTO, row, {
      excludeExtraneousValues: true,
    });
  }
}
