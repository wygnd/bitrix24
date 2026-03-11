import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixHeadhunterVacanciesRepository } from '@/modules/bitrix/infrastructure/database/repositories/headhunter/headhunter-vacancies.repository';

export const headhunterProviders = [
  {
    provide: B24PORTS.HEADHUNTER.HH_VACANCIES_REPOSITORY,
    useClass: BitrixHeadhunterVacanciesRepository,
  },
];
