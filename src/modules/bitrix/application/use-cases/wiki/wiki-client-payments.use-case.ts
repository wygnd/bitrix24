import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixWikiClientPaymentsRepositoryPort } from '@/modules/bitrix/application/ports/wiki/wiki-client-payments-repository.port';
import {
  B24WikiClientPaymentsAttributes,
  B24WikiClientPaymentsCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/wiki/wiki-client-payments.interface';
import { FindOptions } from 'sequelize';

@Injectable()
export class BitrixWikiClientPaymentsUseCase {
  constructor(
    @Inject(B24PORTS.WIKI.WIKI_CLIENT_PAYMENTS_REPOSITORY)
    private readonly bitrixWikiClientPaymentsRepository: BitrixWikiClientPaymentsRepositoryPort,
  ) {}

  async addPayment(fields: B24WikiClientPaymentsCreationalAttributes) {
    return this.bitrixWikiClientPaymentsRepository.addPayment(fields);
  }

  async getPaymentList(options?: FindOptions<B24WikiClientPaymentsAttributes>) {
    return this.bitrixWikiClientPaymentsRepository.getPaymentList(options);
  }
}
