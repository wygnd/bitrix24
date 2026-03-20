import { IEnvironmentDatabaseOptions } from '@shared/interfaces/config/database/main';

export default (): { database: IEnvironmentDatabaseOptions } => ({
  database: {
    host: process.env.ADDY_DATABASE_HOST,
    port: process.env.ADDY_DATABASE_PORT
      ? parseInt(process.env.ADDY_DATABASE_PORT)
      : 5432,
    username: process.env.ADDY_DATABASE_USERNAME,
    password: process.env.ADDY_DATABASE_PASSWORD,
    database: process.env.ADDY_DATABASE_NAME,
    logging: process.env.ADDY_DATABASE_LOGGING
      ? process.env.ADDY_DATABASE_LOGGING == 'true'
      : false,
  },
});
