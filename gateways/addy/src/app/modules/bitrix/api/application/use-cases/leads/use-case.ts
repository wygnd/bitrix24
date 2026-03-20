import { WinstonLogger } from '@shared/logger/winston.logger';
import { Inject } from '@nestjs/common';
import { B24PORTS } from '../../../../constants/ports/constant';
import type { IB24LeadsPort } from '../../ports/leads/port';
import { TB24LeadDuplicateType } from '../../interfaces/leads/duplicates/interface';

export class B24LeadsUseCase {
  private readonly logger = new WinstonLogger(
    B24LeadsUseCase.name,
    'bitrix/leads',
  );

  constructor(
    @Inject(B24PORTS.LEADS.LEADS_DEFAULT)
    private readonly leadsService: IB24LeadsPort,
  ) {}

  /**
   * Try find duplicate leads
   *
   * ---
   *
   * Попытка найти дубликаты по лидам
   * @param type
   * @param fields
   */
  public async findDuplicates(
    type: TB24LeadDuplicateType,
    fields: string | string[],
  ) {
    return this.leadsService.getDuplicateLeads(type, fields);
  }
}
