import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { B24Lead } from './lead.interface';

@Injectable()
export class BitrixLeadService {
  constructor(private readonly bitirxService: BitrixService) {}

  async getLeadById(id: string) {
    return await this.bitirxService.call<B24Lead>('crm.lead.get', {
      id: id,
    });
  }
}
