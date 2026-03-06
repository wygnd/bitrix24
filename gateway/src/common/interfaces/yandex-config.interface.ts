export interface IYandexConfig {
  metrika: IYandexMetrikaConfig;
}

export interface IYandexMetrikaConfig {
  token: string;
  baseUrl: string;
  counters: {
    grampus: string;
    med: string;
  };
}
