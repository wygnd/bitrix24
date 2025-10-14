import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ImbotUnregisterCommandDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'Идентификатор команды для удаления',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  COMMAND_ID: number;

  @ApiProperty({
    type: String,
    required: false,
    description:
      'Строковый идентификатор чат-бота, используется только в режиме Вебхуков',
    example: '123',
  })
  @IsOptional()
  @IsString()
  CLIENT_ID?: string;
}
