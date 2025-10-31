import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class HHVacancyDto {
  @ApiProperty({
    type: String,
    description: 'vacancy id',
    required: true,
    example: '25435313',
  })
  @Expose()
  id: string;

  @ApiProperty({
    type: String,
    description: 'vacancy name',
    required: true,
    example: 'middle developer'
  })
  @Expose()
  name: string;

  @ApiProperty({
    type: String,
    description: 'vacancy url',
    required: true,
    example: 'https://hh.ru/vacancy'
  })
  @Expose()
  alternate_url: string;
}
