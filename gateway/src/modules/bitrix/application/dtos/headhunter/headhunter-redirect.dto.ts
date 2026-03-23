import { IsNotEmpty, IsString } from 'class-validator';

export class HeadhunterRedirectDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
