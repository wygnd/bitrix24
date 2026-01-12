export interface HHBitrixVacancy {
  vacancyId: string;
  url: string;
  label: string;
  bitrixField: HHBitrixVacancyItem | null;
}

export type HHBitrixVacancyItem = {
  id: string;
  value: string;
};

export interface HHBitrixVacancyAttributes extends HHBitrixVacancy {
  id: number;
}

export type HHBitrixVacancyCreationalAttributes = Omit<
  HHBitrixVacancyAttributes,
  'id'
>;

export interface BitrixHeadhunterUpdateVacancyAttributes {
  id: number;
  fields: Partial<HHBitrixVacancyAttributes>;
}
