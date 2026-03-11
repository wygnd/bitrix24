import { Injectable } from '@nestjs/common';
import { BitrixLeadsUpsellRepositoryPort } from '@/modules/bitrix/application/ports/leads/leads-upsell-repository.port';
import {
  B24LeadUpsellAttributes,
  B24LeadUpsellCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/leads/lead-upsell.interface';
import { FindOptions } from 'sequelize';
import { B24LeadUpsellDto } from '@/modules/bitrix/application/dtos/leads/lead-upsell.dto';
import { plainToInstance } from 'class-transformer';
import { LeadUpsellModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-upsell.entity';
import { WinstonLogger } from '@/config/winston.logger';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class BitrixLeadsUpsellRepository implements BitrixLeadsUpsellRepositoryPort {
  private readonly logger = new WinstonLogger(
    BitrixLeadsUpsellRepository.name,
    'bitrix:leads'.split(':'),
  );

  constructor(
    @InjectModel(LeadUpsellModel)
    private readonly upsellRepository: typeof LeadUpsellModel,
  ) {}

  /**
   * Add new upsell in database
   *
   * ---
   *
   * Добавляет новую допродажу в БД
   *
   * @param fields
   * @private
   */
  async addUpsell(
    fields: B24LeadUpsellCreationalAttributes,
  ): Promise<B24LeadUpsellDto | null> {
    try {
      return this.upsellRepository.create(fields).then((response) =>
        plainToInstance(B24LeadUpsellDto, response, {
          excludeExtraneousValues: true,
        }),
      );
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  /**
   * Update upsell in database
   *
   * ---
   *
   * Обновляет допродажу в БД
   * @param id
   * @param fields
   * @private
   */
  async updateUpsell(
    id: number,
    fields: Partial<B24LeadUpsellAttributes>,
  ): Promise<boolean> {
    try {
      const [countUpdate] = await this.upsellRepository.update(fields, {
        where: {
          id: id,
        },
      });

      return countUpdate > 0;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  /**
   * Get upsells upsells by special options
   *
   * ---
   *
   * Получает записи допродаж по определенным параметрам
   * @param options
   */
  async getUpsells(
    options?: FindOptions<B24LeadUpsellAttributes>,
  ): Promise<B24LeadUpsellDto[]> {
    try {
      return this.upsellRepository.findAll(options).then((response) =>
        response.map((upsellEntity) =>
          plainToInstance(B24LeadUpsellDto, upsellEntity, {
            excludeExtraneousValues: true,
          }),
        ),
      );
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }
}
