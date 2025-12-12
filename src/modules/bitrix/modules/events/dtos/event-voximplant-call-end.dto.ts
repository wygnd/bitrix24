import { EventOnDto } from '@/modules/bitrix/modules/events/dtos/event.dto';
import { B24VoxImplantCallEndDataOptions } from '@/modules/bitrix/modules/events/interfaces/evetn-voximplant-call-end.interface';
import {
  B24CallFailedCode,
  B24CallType,
} from '@/modules/bitrix/interfaces/bitrix-call.interface';
import { ApiProperty } from '@nestjs/swagger';

export class B24EventVoxImplantCallEndDataDto implements B24VoxImplantCallEndDataOptions {
  @ApiProperty({
    type: String,
    required: true,
    description: 'Идентификатор звонка из метода',
    example: 'externalCall.3af452b8f8df728be3da71ea6bcbdf96.89764587',
  })
  CALL_ID: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Тип вызова',
    example: B24CallType.OUTGOING,
  })
  CALL_TYPE: B24CallType;

  @ApiProperty({
    type: String,
    required: true,
    description:
      'Номер, с которого звонит абонент (если тип звонка 2 - Входящий) или номер, которому звонит оператор (если тип звонка 1 - Исходящий).',
    example: '+79213246721',
  })
  PHONE_NUMBER: string;

  @ApiProperty({
    type: String,
    required: true,
    description:
      'Номер, на который поступил звонок (если тип звонка 2 - Входящий) или номер, с которого был совершен звонок (если тип звонка 1 - Исходящий).',
    example: 'REST_APP:123',
  })
  PORTAL_NUMBER: string;

  @ApiProperty({
    type: String,
    required: true,
    description:
      'Идентификатор ответившего оператора (если тип звонка 2 - Входящий) или идентификатор позвонившего оператора (если тип звонка 1 - Исходящий).',
    example: '231',
  })
  PORTAL_USER_ID: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Длительность звонка.',
    example: '3',
  })
  CALL_DURATION: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Дата в ISO формате.',
    example: '2023-10-15T17:26:57+03:00',
  })
  CALL_START_DATE: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Стоимость звонка.',
    example: '0',
  })
  COST: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Валюта звонка (RUR, USD, EUR).',
    example: '',
  })
  COST_CURRENCY: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Код вызова',
    example: B24CallFailedCode.SUCCESS,
  })
  CALL_FAILED_CODE: B24CallFailedCode;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Текстовое описание кода вызова',
    example: '',
  })
  CALL_FAILED_REASON: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'ID дела CRM, связанного со звонком.',
    example: '3005970',
  })
  CRM_ACTIVITY_ID: string;
}

export class B24EventVoxImplantCallEndDto extends EventOnDto<B24EventVoxImplantCallEndDataDto> {}
