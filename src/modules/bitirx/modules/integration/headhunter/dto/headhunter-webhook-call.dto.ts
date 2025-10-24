import { HeadhunterWebhookCallInterface } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-webhook-call.interface';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class HeadHunterWebhookCallPayloadDto {
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

export class HeadhunterWebhookCallDto
  implements HeadhunterWebhookCallInterface
{
  @ApiProperty({
    type: String,
    description: 'notification id',
    example: 'notification376261topic48428346786',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    type: Object,
    description: 'notification payload',
    example: {
      topic_id: '83465798743',
      resume_id: 'aad8871c89723uhdfgbj',
      vacancy_id: '437265',
      employer_id: '4325453634',
      response_date: '2025-10-24T11:14:55+0300',
      chat_id: '78645687',
    },
    required: true,
  })
  @IsNotEmpty()
  payload: HeadHunterWebhookCallPayloadDto;

  @ApiProperty({
    type: String,
    description: 'subscription webhook id',
    example: '2354356',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  subscription_id: string;

  @ApiProperty({
    type: String,
    description: 'action type',
    required: true,
    example: 'NEW_RESPONSE_OR_INVITATION_VACANCY',
  })
  @IsNotEmpty()
  @IsString()
  action_type: string;

  @ApiProperty({
    type: String,
    description: 'user id',
    required: true,
    example: '876234987',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;
}
