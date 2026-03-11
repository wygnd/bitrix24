import { IAnalyzeManagerCallRequest } from '../interfaces/interface';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ManagerCallRequestDTO implements IAnalyzeManagerCallRequest {
  @IsNotEmpty({ message: 'lead_id обязателен' })
  @Type(() => Number)
  @IsInt({ message: 'lead_id должен быть числом' })
  lead_id: number;

  @IsNotEmpty({ message: 'post_id обязателен' })
  @Type(() => Number)
  @IsInt({ message: 'post_id должен быть числом' })
  post_id: number;

  @IsNotEmpty({ message: 'source_map обязательна' })
  source_map: Record<string, any>;

  @IsNotEmpty({ message: 'transcribe обязателен' })
  @IsString({ message: 'transcribe должен быть строкой' })
  transcribe: string;
}
