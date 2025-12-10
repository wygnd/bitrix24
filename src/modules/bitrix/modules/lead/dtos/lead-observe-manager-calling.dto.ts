import {
  IsArray,
  IsDate,
  IsIn,
  isISO8601,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LEAD_OBSERVE_MANAGER_CALLING_TYPES } from '@/modules/bitrix/modules/lead/constants/lead-observe-mananger-calling.constants';
import { ApiProperty } from '@nestjs/swagger';
import { LeadObserveManagerCallingResponse } from '@/modules/bitrix/modules/lead/interfaces/lead-observe-manager-calling.interface';

export class LeadObserveManagerCallingItemDto {
  @ApiProperty({
    type: String,
    description: 'Номер телефона',
    required: true,
    example: '79661435153',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Тип звонка',
    required: true,
    example: 'исходящий',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => {
    if (!(value in LEAD_OBSERVE_MANAGER_CALLING_TYPES)) return 'unknown';

    return LEAD_OBSERVE_MANAGER_CALLING_TYPES[value];
  })
  @IsIn(Object.values(LEAD_OBSERVE_MANAGER_CALLING_TYPES), {
    message: `type must be one of the following values: ${Object.keys(LEAD_OBSERVE_MANAGER_CALLING_TYPES).join(', ')}`,
  })
  type: string;

  @ApiProperty({
    type: Date,
    description: 'Дата и время звонка',
    required: true,
    example: new Date().toISOString(),
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (!isISO8601(value)) return 'unknown';

    return new Date(value);
  })
  @IsDate()
  date: Date;
}

export class LeadObserveManagerCallingDto {
  @ApiProperty({
    type: LeadObserveManagerCallingItemDto,
    description: 'Массив звонков',
    isArray: true,
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => LeadObserveManagerCallingItemDto)
  calls: LeadObserveManagerCallingItemDto[];
}

export class LeadObserveManageCallingResponseDataDto {
  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Список обновленных или занесенных в базу лидов',
    example: ['123', '456', '768'],
  })
  updatedLeads: string[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Список пропущенных по непонятной причине лидов.',
    example: ['123', '456', '768'],
  })
  missingLeads: string[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Список лидов, у которых звонок был 5 дней назад и более',
    example: ['123', '456', '768'],
  })
  notifiedLeads: string[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Список лидов, которые были удалены',
    example: ['123', '456', '768'],
  })
  deletedLeads: string[];
}

export class LeadObserveManageCallingResponseTotalDto {
  @ApiProperty({
    type: Number,
    description: 'Кол-во изначально уникальных лидов',
    example: 10,
  })
  uniqueLeads: number;

  @ApiProperty({
    type: Number,
    description: 'Кол-во обновленных или занесенных в базу лидов',
    example: 10,
  })
  updatedLeads: number;

  @ApiProperty({
    type: Number,
    description: 'Кол-во пропущенных по непонятной причине лидов.',
    example: 10,
  })
  missingLeads: number;

  @ApiProperty({
    type: Number,
    description: 'Кол-во лидов, у которых звонок был 5 дней назад и более',
    example: 10,
  })
  notifiedLeads: number;

  @ApiProperty({
    type: Number,
    description: 'Кол-во лидов, которые были удалены',
    example: 10,
  })
  deletedLeads: number;
}

export class LeadObserveManagerCallingResponseDto
  implements LeadObserveManagerCallingResponse
{
  @ApiProperty({
    type: Boolean,
    description: 'Статус ответа',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    type: String,
    description: 'Сообщение',
    example: 'Leads notified successfully.',
  })
  message: string;

  @ApiProperty({
    type: LeadObserveManageCallingResponseDataDto,
    description: 'Результат: список лидов',
  })
  data: LeadObserveManageCallingResponseDataDto;

  @ApiProperty({
    type: LeadObserveManageCallingResponseTotalDto,
    description: 'Результат: количество лидов',
  })
  total: LeadObserveManageCallingResponseTotalDto;
}
