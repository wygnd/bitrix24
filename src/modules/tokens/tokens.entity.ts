import { Column, DataType, Model, Table } from 'sequelize-typescript';
import {
  TokensAttributes,
  TokensCreationalAttributes,
} from '@/modules/tokens/interfaces/tokens-attributes.interface';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';

@Table({ tableName: 'tokens' })
export class TokensModel extends Model<
  TokensAttributes,
  TokensCreationalAttributes
> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'access_token',
  })
  declare accessToken: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'refresh_token',
  })
  declare refreshToken?: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  declare expires: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare service: TokensServices;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare notice?: string;
}
