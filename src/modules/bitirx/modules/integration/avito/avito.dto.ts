import { IsInt, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AvitoFindDuplicateLeadsDto {
  @ApiProperty({
    type: Number,
    description: 'chat id',
    example: 143,
    required: true,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  chat_id: number;

  @ApiProperty({
    type: String,
    description: 'phone number',
    required: true,
    example: '+79212345372',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('RU')
  phone: string;
}
