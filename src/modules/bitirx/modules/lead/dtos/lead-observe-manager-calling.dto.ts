import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class LeadObserveManagerCallingItemDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @IsDate()
  date: Date;
}

export class LeadObserveManagerCallingDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => LeadObserveManagerCallingItemDto)
  calls: LeadObserveManagerCallingItemDto[];
}
