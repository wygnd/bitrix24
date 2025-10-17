import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { B24Lead } from './lead.interface';

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
}
