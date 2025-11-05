export interface HHBitrixVacancy {
  id: string;
  url: string;
  label: string;
  bitrixField: HHBitrixVacancyItem | null
}

export type HHBitrixVacancyItem = {
  ID: string;
  VALUE: string;
};
