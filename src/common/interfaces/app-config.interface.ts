export interface AppConfig {
  apiKey: string;
  apiOptions: AppConfigApiOptions;
}

export interface AppConfigApiOptions {
  username?: string;
  password?: string;
}
