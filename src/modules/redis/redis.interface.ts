import { Optional } from 'sequelize';

export interface IRedisAttributes {
  id: number;
  refresh_token: string;
  application_token: string;
}

export type IRedisCreationAttributes = Optional<IRedisAttributes, 'id'>;
