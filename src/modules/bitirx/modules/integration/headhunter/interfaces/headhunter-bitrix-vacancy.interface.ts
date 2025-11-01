export interface HHBitrixVacancy {
  id: string;
  url: string;
  label: string;
  items: HHBitrixVacancyItem[];
}

export type HHBitrixVacancyItem = {
  ID: string;
  VALUE: string;
};
