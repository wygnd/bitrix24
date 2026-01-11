import { HeadhunterWebhookNegotiationEmployerStateChangePayload } from '@/modules/bitrix/application/interfaces/headhunter/headhunter-webhook-negotiation-employer-state-change.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class HeadhunterWebhookNegotiationEmployerStateChangePayloadDto
  implements HeadhunterWebhookNegotiationEmployerStateChangePayload
{
  @ApiProperty({
    type: String,
    description: 'Идентификатор менеджера, совершившего перевод',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  employer_manager_id: string;

  @ApiProperty({
    type: String,
    description: 'С какого статуса перевели',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  from_state: string;

  @ApiProperty({
    type: String,
    description: 'Идентификатор резюме',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  resume_id: string;

  @ApiProperty({
    type: String,
    description: 'На какой статус перевели',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  to_state: string;

  @ApiProperty({
    type: String,
    description: 'Идентификатор топика',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  topic_id: string;

  @ApiProperty({
    type: String,
    description: 'Время перевода на новый этап',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  transferred_at: string;

  @ApiProperty({
    type: String,
    description: 'Идентификатор вакансии',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  vacancy_id: string;
}
