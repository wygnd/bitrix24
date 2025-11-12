import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class IncomingWebhookApproveSiteForDealDto {
  @ApiProperty({
    type: String,
    description: 'ID Проект менеджера',
    required: true,
    example: 'user_id',
  })
  @IsNotEmpty()
  @Transform(({ value }) => value.split('_')[1])
  @IsString({ message: 'invalid project_manager_id' })
  project_manager_id: string;
}
