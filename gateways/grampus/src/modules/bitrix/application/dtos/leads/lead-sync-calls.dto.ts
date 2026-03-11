import {
  BitrixSyncCallOptions,
  BitrixSyncCalls,
} from '@/modules/bitrix/application/interfaces/leads/lead-sync-calls.interface';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixLeadsSyncCallsOptionsDTO implements BitrixSyncCallOptions {
  @ApiProperty({
    type: String,
    description: 'Номер телефона клиента',
    required: true,
    example: '+79213458128',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Номер авито, с которого обращался клиент',
    required: true,
    example: '+793243587345',
  })
  @IsNotEmpty()
  @IsString()
  avito_number: string;

  @ApiProperty({
    type: String,
    description: 'Навзание авито, с которого обращался клиент',
    required: true,
    example: 'Авито название',
  })
  @IsNotEmpty()
  @IsString()
  avito_name: string;
}

export class BitrixLeadsSyncCallsDTO implements BitrixSyncCalls {
  @ApiProperty({
    type: String,
    description: 'Если передан флаг, то пропускать дубликаты',
    required: false,
    example: '1',
  })
  @IsOptional()
  @IsString()
  only_new?: string;

  @ApiProperty({
    type: BitrixLeadsSyncCallsOptionsDTO,
    description: 'Звонки',
    required: true,
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  calls: BitrixLeadsSyncCallsOptionsDTO[];
}
