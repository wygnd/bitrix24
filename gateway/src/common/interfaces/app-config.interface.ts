export interface AppConfig {
  apiKey: string;
  helpersApiKey: string;
  apiOptions: AppConfigApiOptions;
}

export interface AppConfigApiOptions {
  username?: string;
  password?: string;
}
