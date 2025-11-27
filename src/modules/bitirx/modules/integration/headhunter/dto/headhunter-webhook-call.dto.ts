import { HeadhunterWebhookCallInterface } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-webhook-call.interface';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HeadhunterWebhookCallDto
  implements HeadhunterWebhookCallInterface<any>
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
    required: true,
  })
  @IsNotEmpty()
  payload: any;

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
