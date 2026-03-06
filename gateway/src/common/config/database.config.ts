import { DatabaseConfig } from '@/common/interfaces/database-config.interface';

export default (): { databaseConfig: DatabaseConfig } => ({
  databaseConfig: {
    production: {
      dialect: 'postgres',
      host: process.env.DB_HOST_PRODUCTION || '',
      port: process.env.DB_PORT_PRODUCTION ? +process.env.DB_PORT_PRODUCTION : 5432,
      database: process.env.DB_NAME_PRODUCTION,
      username: process.env.DB_USERNAME_PRODUCTION,
      password: process.env.DB_PASSWORD_PRODUCTION,
      logging: false,
    },
    development: {
      dialect: 'postgres',
      host: process.env.DB_HOST_DEVELOPMENT || 'localhost',
      port: process.env.DB_PORT_DEVELOPMENT ? +process.env.DB_PORT_DEVELOPMENT : 5432,
      database: process.env.DB_NAME_DEVELOPMENT,
      username: process.env.DB_USERNAME_DEVELOPMENT,
      password: process.env.DB_PASSWORD_DEVELOPMENT,
      logging: false,
    },
  },
});
