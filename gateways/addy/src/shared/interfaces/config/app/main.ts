export interface IEnvironmentAppOptions {
  title?: string;
  description?: string;
  port: string;
  docs: {
    swagger: Partial<IEnvironmentAppSwaggerOptions>;
  };
  auth: IEnvironmentAppAuthOptions;
}

export interface IEnvironmentAppAuthOptions {
  token: string;
}

export interface IEnvironmentAppSwaggerOptions {
  version: string;
  username: string;
  password: string;
}
