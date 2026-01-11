import {
  B24WikiClientPaymentsPaymentDto,
} from '@/modules/bitrix/application/dtos/wiki/wiki-client-payments.dto';
import {
  B24WikiClientPaymentsAttributes,
  B24WikiClientPaymentsCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/wiki/wiki-client-payments.interface';
import { FindOptions } from 'sequelize';

export interface BitrixWikiClientPaymentsRepositoryPort {
  addPayment(
    fields: B24WikiClientPaymentsCreationalAttributes,
  ): Promise<B24WikiClientPaymentsPaymentDto | null>;

  getPaymentList(options?: FindOptions<B24WikiClientPaymentsAttributes>): Promise<B24WikiClientPaymentsPaymentDto[]>;
}
