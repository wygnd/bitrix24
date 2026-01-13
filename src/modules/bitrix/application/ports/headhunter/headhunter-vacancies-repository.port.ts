import {
  BitrixHeadhunterUpdateVacancyAttributes,
  HHBitrixVacancyAttributes,
  HHBitrixVacancyCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/headhunter/headhunter-bitrix-vacancy.interface';
import { HHBitrixVacancyDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-bitrix-vacancy.dto';
import { FindOptions } from 'sequelize';

export interface BitrixHeadhunterVacanciesRepositoryPort {
  getVacancies(
    options?: FindOptions<HHBitrixVacancyAttributes>,
  ): Promise<HHBitrixVacancyDto[]>;
  updateVacancy(
    fields: BitrixHeadhunterUpdateVacancyAttributes,
  ): Promise<boolean>;
  addVacancy(
    fields: HHBitrixVacancyCreationalAttributes,
  ): Promise<HHBitrixVacancyDto | null>;
  addVacancies(
    records: HHBitrixVacancyCreationalAttributes[],
    clearBeforeAdd?: boolean,
  ): Promise<HHBitrixVacancyDto[]>;
  removeVacancy(id: number): Promise<boolean>;
  updateVacancies(
    records: BitrixHeadhunterUpdateVacancyAttributes[],
  ): Promise<boolean>;
}
