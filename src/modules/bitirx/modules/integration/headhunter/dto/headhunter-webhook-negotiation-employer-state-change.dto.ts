import { HeadhunterWebhookNegotiationEmployerStateChangePayload } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-webhook-negotiation-employer-state-change.interface';
import { ApiProperty } from '@nestjs/swagger';

export class HeadhunterWebhookNegotiationEmployerStateChangePayloadDto
  implements HeadhunterWebhookNegotiationEmployerStateChangePayload
{
  @ApiProperty({
    type: String,
    description: 'Идентификатор менеджера, совершившего перевод',
    required: true,
    example: '',
  })
  employer_manager_id: string;

  @ApiProperty({
    type: String,
    description: 'С какого статуса перевели',
    required: true,
    example: '',
  })
  from_state: string;

  @ApiProperty({
    type: String,
    description: 'Идентификатор резюме',
    required: true,
    example: '',
  })
  resume_id: string;

  @ApiProperty({
    type: String,
    description: 'На какой статус перевели',
    required: true,
    example: '',
  })
  to_state: string;

  @ApiProperty({
    type: String,
    description: 'Идентификатор топика',
    required: true,
    example: '',
  })
  topic_id: string;

  @ApiProperty({
    type: String,
    description: 'Время перевода на новый этап',
    required: true,
    example: '',
  })
  transferred_at: string;

  @ApiProperty({
    type: String,
    description: 'Идентификатор вакансии',
    required: true,
    example: '',
  })
  vacancy_id: string;
}
