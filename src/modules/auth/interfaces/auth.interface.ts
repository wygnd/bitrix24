import { Optional } from 'sequelize';

export interface IAuthAttributes {
  id: number;
  refresh_token: string;
  application_token: string;
}

export type IAuthCreationAttributes = Optional<IAuthAttributes, 'id'>;
