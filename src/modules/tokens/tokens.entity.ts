import { Model, Table } from 'sequelize-typescript';
import {
  TokensAttributes,
  TokensCreationalAttributes,
} from '@/modules/tokens/interfaces/tokens-attributes.interface';

@Table({ tableName: 'tokens' })
export class TokenModel extends Model<
  TokensAttributes,
  TokensCreationalAttributes
> {
  declare accessToken: string;

  declare refreshToken: string;

  declare expires: number;

  declare expiresAt: number;
}
