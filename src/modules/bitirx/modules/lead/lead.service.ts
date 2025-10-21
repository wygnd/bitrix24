import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import {
  B24DuplicateFindByComm,
  B24DuplicateFindByCommResponse,
  B24Lead,
} from './lead.interface';

@Injectable()
export class BitrixLeadService {
  constructor(private readonly bitrixService: BitrixService) {}

  async getLeadById(id: string) {
    return await this.bitrixService.callMethod<Partial<B24Lead>, B24Lead>(
      'crm.lead.get',
      {
        ID: id,
      },
    );
  }

  async getDuplicateLeadsByPhone(phone: string) {
    return await this.bitrixService.callMethod<
      B24DuplicateFindByComm,
      B24DuplicateFindByCommResponse
    >('crm.duplicate.findbycomm', {
      type: 'PHONE',
      values: [phone],
      entity_type: 'LEAD',
    });
  }

  async createLead(fields: Partial<B24Lead>) {
    return this.bitrixService.callMethod<Partial<B24Lead>, number>(
      'crm.lead.add',
      fields,
    );
  }
}
