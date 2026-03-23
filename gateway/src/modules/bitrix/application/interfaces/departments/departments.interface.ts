export interface B24Department {
  ID: string;
  NAME: string;
  SORT: number;
  PARENT: string;
  UF_HEAD: string;
}

export enum B24DepartmentTypeId {
  SITE = 'site',
  ADVERT = 'advert',
  SEO = 'seo',
}

export type DepartmentTypeIds = Record<B24DepartmentTypeId, number[]>;
