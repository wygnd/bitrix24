import { IWikiAnalyzeManagerCallsRequest } from '@/modules/wiki/interfaces/wiki-analyze-manager-calls.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class WikiAnalyzeManagerCallsDTO implements IWikiAnalyzeManagerCallsRequest {
  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty({ message: 'lead_id обязателен' })
  @IsString({ message: 'lead_id должен быть строкой' })
  lead_id: number;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty({ message: 'post_id обязателен' })
  @Type(() => Number)
  @IsInt({ message: 'post_id должен быть числом' })
  post_id: number;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty({ message: 'source_map обязательна' })
  source_map: Record<string, any>;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty({ message: 'transcribe обязателен' })
  @IsString({ message: 'transcribe должен быть строкой' })
  transcribe: string;
}
