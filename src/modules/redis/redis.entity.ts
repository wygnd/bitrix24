import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { IRedisAttributes, IRedisCreationAttributes } from './redis.interface';
import { ApiProperty } from '@nestjs/swagger';

@Table({ tableName: 'auth' })
export class AuthModel extends Model<
  IRedisAttributes,
  IRedisCreationAttributes
> {
  @ApiProperty({
    type: Number,
    description: 'Unique identifier',
    example: 1,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ApiProperty({
    type: String,
    description: 'refresh token',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare refresh_token: string;

  @ApiProperty({
    type: String,
    description: 'Appliaction token',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare application_token: string;
}
