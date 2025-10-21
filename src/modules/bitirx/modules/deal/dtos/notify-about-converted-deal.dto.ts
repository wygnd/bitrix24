import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class NotifyAboutConvertedDealDto {
  @ApiProperty({
    type: String,
    description: 'Bitrix user id',
    example: 376,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  assigned_id: string;

  @ApiProperty({
    type: Boolean,
    description:
      'Flag sets true if manager dont answer on message during 15 minutes',
    example: true,
    required: true,
  })
  @IsNotEmpty()
  @Type(() => Boolean)
  @IsBoolean()
  ignored: boolean;
}
