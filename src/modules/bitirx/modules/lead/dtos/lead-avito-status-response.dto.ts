import {
  LeadAvitoStatus,
  LeadAvitoStatusResponse,
} from '@/modules/bitirx/modules/lead/interfaces/lead-avito-status.interface';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { B24LeadStatus } from '@/modules/bitirx/modules/lead/interfaces/lead.interface';

export class LeadAvitoStatusItemDto implements LeadAvitoStatus {
  @ApiProperty({
    type: String,
    description: 'avito name',
    example: 'Авито пример',
  })
  avito_number: string;

  @ApiProperty({
    type: String,
    description: 'avito number',
    example: '79999999999',
  })
  avito_name: string;

  @ApiProperty({
    type: String,
    description: 'create date',
    example: new Date().toISOString(),
  })
  date_cerate: string;

  @ApiProperty({
    type: String,
    description: 'last request date',
    example: new Date().toISOString(),
    required: false,
  })
  date_last_request: string;

  @ApiProperty({
    type: String,
    description: 'status',
    enum: B24LeadStatus,
    example: B24LeadStatus.ACTIVE,
  })
  status: B24LeadStatus;
}

@ApiExtraModels(LeadAvitoStatusItemDto)
export class LeadAvitoStatusResponseDto implements LeadAvitoStatusResponse {
  @ApiProperty({
    type: Number,
    description: 'count find leads',
    example: 10,
  })
  count_leads: number;

  @ApiProperty({
    type: 'object',
    description: 'leads',
    properties: {},
    additionalProperties: {
      $ref: getSchemaPath(LeadAvitoStatusItemDto),
    },
  })
  leads: Record<string, LeadAvitoStatus>;
}
