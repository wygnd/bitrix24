export interface IEnvironmentOptions {
  application: IEnvironmentAppOptions;
  bitrix: IEnvironmentBitrixOptions;
  redis: IEnvironmentRedisOptions;
}

export interface IEnvironmentAppOptions {
  title?: string;
  description?: string;
  port: string;
  docs: {
    swagger: Partial<IEnvironmentAppSwaggerOptions>;
  };
}

export interface IEnvironmentAppSwaggerOptions {
  version: string;
  username: string;
  password: string;
}

export interface IEnvironmentBitrixOptions {
  base_url: string;
  client_id: string;
  client_secret: string;
}

export interface IEnvironmentRedisOptions {
  host: string;
  port: string;
  user?: string;
  password?: string;
}