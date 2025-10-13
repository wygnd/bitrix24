import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  dialogId: number;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  keyboards: string[];
}
