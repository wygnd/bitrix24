import { EventOnDto } from '@/modules/bitrix/modules/events/dtos/event.dto';
import { ApiProperty } from '@nestjs/swagger';
import { B24VoxImplantCallStartDataOptions } from '@/modules/bitrix/modules/events/interfaces/event-voximplant-call-start.interface';
import { IsNotEmpty, IsString } from 'class-validator';

export class B24EventVoxImplantCallStartDataDto implements B24VoxImplantCallStartDataOptions {
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
    description: 'ID пользователя, принявшего звонок',
    example: '213',
  })
  @IsNotEmpty()
  @IsString()
  USER_ID: string;
}

export class B24EventVoxImplantStartInitDto extends EventOnDto<B24EventVoxImplantCallStartDataDto> {}
