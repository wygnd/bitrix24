import { EventOnDto } from '@/modules/bitrix/modules/events/dtos/event.dto';
import { B24VoxImplantCallInitDataOptions } from '@/modules/bitrix/modules/events/interfaces/event-voximplant-call-init.interface';
import { B24CallType } from '@/modules/bitrix/interfaces/bitrix-call.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class B24EventVoxImplantCallInitDataDto implements B24VoxImplantCallInitDataOptions {
  @ApiProperty({
    type: String,
    required: true,
    description: 'Идентификатор звонка из метода',
    example: 'externalCall.3af452b8f8df728be3da71ea6bcbdf96.89764587',
  })
  @IsNotEmpty()
  @IsString()
  CALL_ID: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Тип вызова',
    example: B24CallType.OUTGOING,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(B24CallType))
  CALL_TYPE: B24CallType;

  @ApiProperty({
    type: String,
    required: true,
    description:
      'Номер, которому звонит оператор (если тип звонка: 1 - Исходящий) или номер, на который звонит абонент (если тип звонка: 2 - Входящий).',
    example: '+79231237810',
  })
  @IsNotEmpty()
  @IsString()
  CALLER_ID: string;

  @ApiProperty({
    type: String,
    required: true,
    description:
      'Идентификатор линии (если тип звонка: 1 - Исходящий) или номер телефона, который позвонил на портал (если тип звонка: 2 - Входящий).',
    example: '230',
  })
  @IsNotEmpty()
  @IsString()
  REST_APP_ID: string;
}

export class B24EventVoxImplantCallInitDto extends EventOnDto<B24EventVoxImplantCallInitDataDto> {}
