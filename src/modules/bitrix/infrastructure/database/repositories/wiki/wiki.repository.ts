import { Injectable } from '@nestjs/common';
import type { BitrixWikiClientPaymentsRepositoryPort } from '@/modules/bitrix/application/ports/wiki/wiki-client-payments-repository.port';
import { B24WikiClientPaymentsModel } from '@/modules/bitrix/infrastructure/database/entities/wiki/wiki-client-payments.entity';
import { B24WikiClientPaymentsPaymentDto } from '@/modules/bitrix/application/dtos/wiki/wiki-client-payments.dto';
import {
  B24WikiClientPaymentsAttributes,
  B24WikiClientPaymentsCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/wiki/wiki-client-payments.interface';
import { FindOptions } from 'sequelize';
import { plainToInstance } from 'class-transformer';
import { WinstonLogger } from '@/config/winston.logger';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class BitrixWikiClientPaymentsRepository implements BitrixWikiClientPaymentsRepositoryPort {
  private readonly logger = new WinstonLogger(
    BitrixWikiClientPaymentsRepository.name,
    'bitrix:wiki'.split(':'),
  );

  constructor(
    @InjectModel(B24WikiClientPaymentsModel)
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
      this.logger.debug({
        message: 'Add new payment',
        handler: this.addPayment.name,
        body: fields,
        response: payment,
      });
      return this.dto(payment);
    } catch (error) {
      this.logger.error({
        handler: this.addPayment.name,
        fields,
        error,
      });
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
    try {
      return (await this.wikiClientPaymentsRepository.findAll(options)).map(
        (p) => this.dto(p),
      );
    } catch (error) {
      this.logger.error({
        handler: this.getPaymentList.name,
        error,
      });
      return [];
    }
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
