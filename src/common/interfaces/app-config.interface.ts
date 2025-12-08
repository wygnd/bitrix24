export interface AppConfig {
  apiKey: string;
  apiOptions: AppConfigApiOptions;
}

interface AppConfigApiOptions {
  username?: string;
  password?: string;
}
