export interface IMicroservicesConfig {
  users: IMicroservicesUsersConfig;
}

interface IMicroservicesUsersConfig {
  port?: string;
}
