import {
  HHBitrixVacancy,
  HHBitrixVacancyItem,
} from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-bitrix-vacancy.interface';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HHBitrixVacancyDto implements HHBitrixVacancy {
  @ApiProperty({
    type: String,
    description: 'hh vacancy id',
    required: true,
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    description: 'hh vacancy title',
    required: true,
    example: 'frotnend developer',
  })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({
    type: String,
    description: 'hh vacancy url',
    required: true,
    example: 'https://hh.ru/vacancy/1234',
  })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty({
    type: String,
    description: 'Vacancy ids from bitrix field',
    required: true,
    example: [
      {
        ID: '2345',
        VALUE: 'Developer',
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({
    each: true,
  })
  bitrixField: HHBitrixVacancyItem | null;
}
