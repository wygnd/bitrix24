export interface IYandexConfig {
  metrika: IYandexMetrikaConfig;
  direct: IYandexDirectConfig;
}

export interface IYandexMetrikaConfig {
  token: string;
  baseUrl: string;
  counters: {
    grampus: string;
    med: string;
  };
}

export interface IYandexDirectConfig {
  baseUrl: string;
  authToken: string;
  masterToken: string;
  login: string;
}
