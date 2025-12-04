import { TokensAttributes } from '@/modules/tokens/interfaces/tokens-attributes.interface';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TokensDto implements TokensAttributes {
  @Expose()
  @ApiProperty({
    type: Number,
    description: 'token id',
    example: 1,
  })
  id: number;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'access token',
    example: 'f883c20e-11ae-4f27-87d8-7cdc5e61538d',
  })
  accessToken: string;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'refresh token if exists',
    example: 'f883c20e-11ae-4f27-87d8-7cdc5e61538d',
  })
  refreshToken?: string;

  @Expose()
  @ApiProperty({
    type: Number,
    description: 'expires token in milliseconds',
    example: '1764572892000',
  })
  expires: number;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'auth service',
    example: TokensServices.BITRIX_APP,
  })
  service: TokensServices;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'description',
    example: 'this tokens for auth bitrix',
  })
  notice?: string;
}
