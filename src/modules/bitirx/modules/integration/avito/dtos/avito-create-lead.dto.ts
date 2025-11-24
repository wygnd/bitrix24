import {
  IsArray,
  IsBase64,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AvitoClientRequestsType } from '@/modules/bitirx/modules/integration/avito/avito.constants';
import { Transform, Type } from 'class-transformer';
import {
  B24FileReceive,
  B24MimeType,
} from '@/modules/bitirx/interfaces/bitrix-file.interface';

export class AvitoCreateLeadFileDto implements B24FileReceive {
  @ApiProperty({
    type: String,
    description: 'type',
    example: 'file_attachment',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    type: String,
    description: 'filename',
    example: 'story.png',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  filename: string;

  @ApiProperty({
    type: String,
    enum: B24MimeType,
    description: 'content type',
    example: B24MimeType.JPG,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(B24MimeType)
  content_type: B24MimeType;

  @ApiProperty({
    type: String,
    description: 'base64',
    example: 'SGVsbG8gV29ybGQ=',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsBase64()
  content_base64: string;
}

export class AvitoCreateLeadDto {
  @ApiProperty({
    type: Number,
    description: 'unique wiki lead id',
    required: true,
    example: 12345,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  wiki_lead_id: number;

  @ApiProperty({
    type: [String],
    description: 'array messages',
    required: false,
    example: ['hello', 'world', '!'],
  })
  @IsOptional()
  @IsArray({ message: 'messages must be an array' })
  @IsString({ each: true, message: 'Invalid messages field' })
  messages: string[];

  @ApiProperty({
    type: String,
    description: 'Avito name',
    required: false,
    example: 'Авито Название авито',
  })
  @IsOptional()
  @IsString()
  avito: string = '';

  @ApiProperty({
    type: String,
    description: 'Phone number',
    required: true,
    example: '+79999999999',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('RU')
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Avito phone number',
    required: true,
    example: '+79999999999',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('RU')
  avito_number: string;

  @ApiProperty({
    type: String,
    description: 'Region',
    required: false,
    example: 'Москва',
  })
  @IsOptional()
  @IsString()
  region: string = '';

  @ApiProperty({
    type: String,
    description: 'City',
    required: false,
    example: 'Город',
  })
  @IsOptional()
  @IsString()
  city: string = '';

  @ApiProperty({
    type: String,
    description: 'Is ai get answer',
    required: false,
    default: '0',
    example: '1',
  })
  @IsOptional()
  @IsString()
  is_ai: string = '0';

  @ApiProperty({
    type: String,
    description: 'Client name',
    required: false,
    default: '',
    example: 'Кирил',
  })
  @IsOptional()
  @IsString()
  client_name: string = '';

  @ApiProperty({
    type: String,
    description: 'Services',
    required: false,
    example: 'Разработка сайта',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => AvitoClientRequestsType[value.toLowerCase()] ?? '')
  service_text: string = '';

  @ApiProperty({
    type: String,
    description: 'Date',
    required: false,
    default: '',
    example: '2025-10-25',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    type: String,
    description: 'Time',
    required: false,
    default: '',
    example: '10:30',
  })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({
    type: AvitoCreateLeadFileDto,
    example: AvitoCreateLeadFileDto,
    isArray: true,
    description: 'Файлы',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => AvitoCreateLeadFileDto)
  files: AvitoCreateLeadFileDto[] = [];
}
