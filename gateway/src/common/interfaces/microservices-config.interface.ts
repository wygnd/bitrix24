export interface IMicroservicesConfig {
  users: IMicroservicesUsersConfig;
  robots: IMicroservicesRobotsConfig;
}

interface IMicroservicesUsersConfig {
  port?: string;
}

interface IMicroservicesRobotsConfig {
  host?: string;
}
