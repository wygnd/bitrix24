import { SequelizeOptions } from 'sequelize-typescript';

export interface DatabaseConfig {
  production: SequelizeOptions;
  development: SequelizeOptions;
}
