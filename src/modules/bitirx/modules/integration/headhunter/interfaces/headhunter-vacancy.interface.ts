export interface IVacancy {
  vacancy_id: string;
  vacancy_list: VacancyBitrixOptions[];
}

type VacancyBitrixOptions = {
  ID: string;
  VALUE: string;
};
