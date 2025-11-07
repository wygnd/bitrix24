import {
  B24BotProperties,
  B24ImbotRegisterOptions,
} from '@/modules/bitirx/modules/imbot/imbot.interface';
import {
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ImbotRegisterPropertiesDto implements B24BotProperties {
  @ApiProperty({
    type: String,
    description: 'bot name',
    required: true,
    example: 'echo bot',
  })
  @IsNotEmpty()
  @IsString()
  NAME: string;

  @ApiProperty({
    type: String,
    description: 'bot last name',
    required: false,
    example: 'bot last name',
    default: '',
  })
  @IsOptional()
  @IsString()
  LAST_NAME: string = '';

  @ApiProperty({
    type: String,
    description: 'bot color',
    required: false,
    example: 'PURPLE',
    default: '',
  })
  @IsOptional()
  @IsString()
  COLOR: string = '';

  @ApiProperty({
    type: String,
    description: 'bot email',
    required: false,
    example: 'bot@gmail.com',
    default: '',
  })
  @IsOptional()
  @IsString()
  EMAIL: string = '';

  @ApiProperty({
    type: String,
    description: 'birthday date',
    required: false,
    example: '24.10.2004',
    default: '',
  })
  @IsOptional()
  @IsString()
  PERSONAL_BIRTHDAY: string = '';

  @ApiProperty({
    type: String,
    description: 'bot work position',
    required: false,
    example: 'programmer',
    default: '',
  })
  @IsOptional()
  @IsString()
  WORK_POSITION: string = '';

  @ApiProperty({
    type: String,
    description: 'bot persatel website',
    required: false,
    example: 'https://exmaple-bot.com/',
    default: '',
  })
  @IsOptional()
  @IsString()
  PERSONAL_WWW: string = '';

  @ApiProperty({
    type: String,
    description: 'bot gender',
    required: false,
    example: 'F',
    default: '',
  })
  @IsOptional()
  @IsIn(['M', 'F'])
  PERSONAL_GENDER: string = 'M';

  @ApiProperty({
    type: String,
    description: 'bot photo',
    required: false,
    default: '',
  })
  @IsOptional()
  @IsString()
  PERSONAL_PHOTO: string = '';
}

export class ImbotRegisterDto implements B24ImbotRegisterOptions {
  @ApiProperty({
    type: String,
    description: 'bot code',
    required: true,
    example: 'echobot',
  })
  @IsNotEmpty()
  @IsString()
  CODE: string;

  @ApiProperty({
    type: String,
    description: 'bot type: B - default bot, S - supervisor, O - openline',
    required: false,
    example: 'S',
    default: 'B',
  })
  @IsOptional()
  @IsIn(['B', 'O', 'S'])
  TYPE: 'B' | 'O' | 'S' = 'B';

  @ApiProperty({
    type: String,
    description: 'bot handler url',
    required: true,
    example: 'https://bot.com/handler',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  EVENT_HANDLER: string;

  @ApiProperty({
    type: String,
    description: 'is openline mode',
    required: false,
    example: 'N',
    default: 'Y',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  OPENLINE: string = 'Y';

  @ApiProperty({
    type: String,
    description: 'client id',
    required: false,
    example: '1',
    default: '',
  })
  @IsOptional()
  @IsString()
  CLIENT_ID: string = '';

  @ApiProperty({
    type: ImbotRegisterPropertiesDto,
    description: 'bot properties',
    required: true,
  })
  @IsNotEmpty()
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ImbotRegisterPropertiesDto)
  PROPERTIES: ImbotRegisterPropertiesDto;
}
