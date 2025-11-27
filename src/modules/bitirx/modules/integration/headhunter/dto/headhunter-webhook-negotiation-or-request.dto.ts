import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HeadhunterWebhookNegotiationOrRequestPayload } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-webhook-negotiation-or-request.interface';

export class HeadHunterWebhookNegotiationOrRequestPayloadDto
  implements HeadhunterWebhookNegotiationOrRequestPayload
{
  @ApiProperty({
    type: String,
    description: 'Payload topic id',
    required: true,
    example: '43653645765',
  })
  @IsNotEmpty()
  @IsString()
  topic_id: string;

  @ApiProperty({
    type: String,
    description: 'resume id',
    required: true,
    example: '3u6iyegfwyuti76327965367rgdfye',
  })
  @IsNotEmpty()
  @IsString()
  resume_id: string;

  @ApiProperty({
    type: String,
    description: 'vacancy id',
    required: true,
    example: '21342353456',
  })
  @IsNotEmpty()
  @IsString()
  vacancy_id: string;

  @ApiProperty({
    type: String,
    description: 'employer id',
    required: true,
    example: '3426345345',
  })
  @IsNotEmpty()
  @IsString()
  employer_id: string;

  @ApiProperty({
    type: String,
    description: 'webhook call date',
    required: true,
    example: '2025-10-24T11:14:55+0300',
  })
  @IsNotEmpty()
  @IsString()
  response_date: string;

  @ApiProperty({
    type: String,
    description: 'chat id',
    required: true,
    example: '23434534543',
  })
  @IsNotEmpty()
  @IsString()
  chat_id: string;
}
