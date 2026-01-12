import {
  BitrixHeadhunterUpdateVacancyAttributes,
  HHBitrixVacancyAttributes,
  HHBitrixVacancyCreationalAttributes,
  HHBitrixVacancyItem,
} from '@/modules/bitrix/application/interfaces/headhunter/headhunter-bitrix-vacancy.interface';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class HHBitrixVacancyDto implements HHBitrixVacancyAttributes {
  @ApiProperty({
    type: Number,
    description: 'ID записи',
    required: true,
    example: 1,
  })
  @Expose()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty({
    type: String,
    description: 'hh vacancy id',
    required: true,
    example: '1234',
  })
  @Expose()
  @IsOptional()
  @IsString()
  vacancyId: string;

  @ApiProperty({
    type: String,
    description: 'hh vacancy title',
    required: true,
    example: 'frotnend developer',
  })
  @Expose()
  label: string;

  @ApiProperty({
    type: String,
    description: 'hh vacancy url',
    required: true,
    example: 'https://hh.ru/vacancy/1234',
  })
  @Expose()
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
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => BitrixHeadhunterVacancyBitrixFieldDTO)
  bitrixField: BitrixHeadhunterVacancyBitrixFieldDTO | null = null;
}

class BitrixHeadhunterVacancyBitrixFieldDTO implements HHBitrixVacancyItem {
  @ApiProperty({
    type: String,
    description: 'ID элемента в битрикс',
    required: true,
    example: '1234',
  })
  @Expose()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    description: 'Название поля',
    required: true,
    example: 'Менеджер',
  })
  @Expose()
  @IsNotEmpty()
  @IsString()
  value: string;
}

export class BitrixHeadhunterVacancyCreateDTO implements HHBitrixVacancyCreationalAttributes {
  @ApiProperty({
    type: String,
    description: 'ID вакансии',
    required: true,
    example: '128937652',
  })
  @IsNotEmpty()
  @IsString()
  vacancyId: string;

  @ApiProperty({
    type: String,
    description: 'ссылка на вакансию',
    required: true,
    example: 'https://hh.ru/vacancy/128937652',
  })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty({
    type: String,
    description: 'Название вакансии',
    required: true,
    example: 'Менеджер по прадажам',
  })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({
    type: BitrixHeadhunterVacancyBitrixFieldDTO,
    description: 'Вакансия в bitrix',
    required: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BitrixHeadhunterVacancyBitrixFieldDTO)
  bitrixField: BitrixHeadhunterVacancyBitrixFieldDTO | null = null;
}

export class BitrixHeadhunterVacancyUpdateDTO implements BitrixHeadhunterUpdateVacancyAttributes {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => HHBitrixVacancyDto)
  fields: Partial<HHBitrixVacancyDto>;
}
