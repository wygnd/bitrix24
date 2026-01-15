import { Injectable } from '@nestjs/common';
import { BitrixHeadhunterVacancyModel } from '@/modules/bitrix/infrastructure/database/entities/headhunter/headhunter-vacancy.entity';
import { BitrixHeadhunterVacanciesRepositoryPort } from '@/modules/bitrix/application/ports/headhunter/headhunter-vacancies-repository.port';
import {
  BitrixHeadhunterUpdateVacancyAttributes,
  HHBitrixVacancyAttributes,
  HHBitrixVacancyCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/headhunter/headhunter-bitrix-vacancy.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { plainToInstance } from 'class-transformer';
import { HHBitrixVacancyDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-bitrix-vacancy.dto';
import { DestroyOptions, FindOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class BitrixHeadhunterVacanciesRepository implements BitrixHeadhunterVacanciesRepositoryPort {
  private readonly logger = new WinstonLogger(
    BitrixHeadhunterVacanciesRepository.name,
    'headhunter'.split(':'),
  );

  constructor(
    @InjectModel(BitrixHeadhunterVacancyModel)
    private readonly headhunterVacanciesRepository: typeof BitrixHeadhunterVacancyModel,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Get ratio list vacancies from database
   *
   * ---
   *
   * Получить список вакансий из БД
   */
  public async getVacancies(
    options: FindOptions<HHBitrixVacancyAttributes> = {},
  ): Promise<HHBitrixVacancyDto[]> {
    try {
      return (await this.headhunterVacanciesRepository.findAll(options)).map(
        (r) => this.formDTO(r),
      );
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  /**
   * Update one vacancy
   *
   * ---
   *
   * Обновить вакансию
   */
  public async updateVacancy({
    id,
    fields,
  }: BitrixHeadhunterUpdateVacancyAttributes): Promise<boolean> {
    try {
      const [updated] = await this.headhunterVacanciesRepository.update(
        fields,
        {
          where: {
            id: id,
          },
        },
      );
      return updated > 0;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Add new vacancy row in database
   *
   * ---
   *
   * Добавить новую вакансию в БД
   */
  public async addVacancy(
    fields: HHBitrixVacancyCreationalAttributes,
  ): Promise<HHBitrixVacancyDto | null> {
    try {
      const newVacancy =
        await this.headhunterVacanciesRepository.create(fields);

      return this.formDTO(newVacancy);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Remove vacancy row from database
   *
   * ---
   *
   * Удалить вакансию из БД
   */
  public async removeVacancy(id: number | number[]): Promise<boolean> {
    try {
      const wasDeleted = await this.headhunterVacanciesRepository.destroy({
        where: {
          id: Array.isArray(id) ? id : [id],
        },
      });

      return wasDeleted > 0;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Add multiply vacancies
   *
   * ---
   *
   * Добавить несколько вакансий
   * @param records
   * @param clearBeforeAdd
   */
  public async addVacancies(
    records: HHBitrixVacancyCreationalAttributes[],
    clearBeforeAdd: boolean = false,
  ): Promise<HHBitrixVacancyDto[]> {
    const t = await this.sequelize.transaction();
    try {
      if (clearBeforeAdd)
        await this.clearVacancies({
          restartIdentity: true,
          cascade: true,
          transaction: t,
        });

      const response = (
        await this.headhunterVacanciesRepository.bulkCreate(records, {
          transaction: t,
        })
      ).map((r) => this.formDTO(r));
      await t.commit();
      return response;
    } catch (error) {
      this.logger.log(error, 'fatal');
      await t.rollback();
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Update multiply vacancies
   *
   * ---
   *
   * Обновить несколько вакансий
   */
  public async updateVacancies(
    records: BitrixHeadhunterUpdateVacancyAttributes[],
  ): Promise<boolean> {
    try {
      await this.sequelize.transaction(async (t) =>
        Promise.all(
          records.map(({ id, fields }) =>
            this.headhunterVacanciesRepository.update(
              {
                label: fields.label,
                url: fields.url,
                bitrixField: fields.bitrixField,
              },
              {
                transaction: t,
                where: {
                  id: id,
                },
              },
            ),
          ),
        ),
      );
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Clear vacancies in database
   *
   * ---
   *
   * Отчистить записи в БД
   */
  private async clearVacancies(
    options?: DestroyOptions<HHBitrixVacancyAttributes>,
  ) {
    try {
      await this.headhunterVacanciesRepository.truncate(options);
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  private formDTO(row: BitrixHeadhunterVacancyModel) {
    return plainToInstance(HHBitrixVacancyDto, row, {
      excludeExtraneousValues: true,
    });
  }
}
