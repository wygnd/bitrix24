import { Inject, Injectable } from '@nestjs/common';
import { WIKI_CLIENT_PAYMENTS_REPOSITORY } from '@/modules/bitrix/modules/integration/wiki/constants/wiki-client-payments.constants';
import { B24WikiClientPaymentsModel } from '@/modules/bitrix/modules/integration/wiki/etities/wiki-client-payments.entity';
import {
  B24WikiClientPaymentsAttributes,
  B24WikiClientPaymentsCreationalAttributes,
} from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-client-payments.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { plainToInstance } from 'class-transformer';
import { B24WikiClientPaymentsPaymentDto } from '@/modules/bitrix/modules/integration/wiki/dtos/wiki-client-payments.dto';
import { FindOptions, WhereOptions } from 'sequelize';

@Injectable()
export class B24WikiClientPaymentsService {
  private readonly logger = new WinstonLogger(
    B24WikiClientPaymentsService.name,
    'bitrix:services:integration:wiki'.split(':'),
  );

  constructor(
    @Inject(WIKI_CLIENT_PAYMENTS_REPOSITORY)
    private readonly wikiClientPaymentsRepository: typeof B24WikiClientPaymentsModel,
  ) {}

  /**
   * Add new post in database
   *
   * ---
   *
   * Добавляет новую запись в БД
   * @param fields
   */
  public async addPayment(fields: B24WikiClientPaymentsCreationalAttributes) {
    try {
      const payment = await this.wikiClientPaymentsRepository.create(fields);
      return this.dto(payment);
    } catch (error) {
      this.logger.error(error, true);
      return null;
    }
  }

  /**
   * Get items from database
   *
   * ---
   *
   * Получить записи из БД
   */
  public async getPaymentListOld(
    selectFields?: (keyof B24WikiClientPaymentsAttributes)[],
    filter?: WhereOptions<B24WikiClientPaymentsAttributes>,
  ) {
    return (
      await this.wikiClientPaymentsRepository.findAll({
        where: filter,
        attributes:
          selectFields && selectFields?.length > 0 ? selectFields : undefined,
      })
    ).map((p) => this.dto(p));
  }

  public async getPaymentList(
    options?: FindOptions<B24WikiClientPaymentsAttributes>,
  ) {
    return (await this.wikiClientPaymentsRepository.findAll(options)).map((p) =>
      this.dto(p),
    );
  }

  /**
   * Transform Model to DTO
   *
   * ---
   *
   * Фильтрует объект
   * @param item
   * @private
   */
  private dto(
    item: B24WikiClientPaymentsModel,
  ): B24WikiClientPaymentsPaymentDto {
    return plainToInstance(B24WikiClientPaymentsPaymentDto, item, {
      excludeExtraneousValues: true,
    });
  }
}
