import { Inject, Injectable } from '@nestjs/common';
import type { BitrixWikiClientPaymentsRepositoryPort } from '@/modules/bitrix/application/ports/wiki/wiki-client-payments-repository.port';
import { B24WikiClientPaymentsModel } from '@/modules/bitrix/infrastructure/database/entities/wiki/wiki-client-payments.entity';
import { B24WikiClientPaymentsPaymentDto } from '@/modules/bitrix/application/dtos/wiki/wiki-client-payments.dto';
import {
  B24WikiClientPaymentsAttributes,
  B24WikiClientPaymentsCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/wiki/wiki-client-payments.interface';
import { FindOptions } from 'sequelize';
import { plainToInstance } from 'class-transformer';
import { WIKI_CLIENT_PAYMENTS_REPOSITORY } from '@/modules/bitrix/application/constants/wiki/wiki-client-payments.constants';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixWikiRepository implements BitrixWikiClientPaymentsRepositoryPort {
  private readonly logger = new WinstonLogger(
    BitrixWikiRepository.name,
    'bitrix:wiki'.split(':'),
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
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Get payments list
   *
   * ---
   *
   * Получить список платежей
   * @param options
   */
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
