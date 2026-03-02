import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { B24WebhookFillableSiteBrief } from '@/modules/bitrix/application/interfaces/webhooks/webhook-fillable-site-brief.interface';

export class IncomingWebhookFillableSiteBriefDto implements Omit<
  B24WebhookFillableSiteBrief,
  'deal_id'
> {
  @ApiProperty({
    type: String,
    description: 'Ссылка на бриф',
    required: true,
    example: 'https://example.com/briefs/123',
  })
  @IsNotEmpty({
    message: 'Brief link is required',
  })
  @IsString()
  brief_link: string;

  @ApiProperty({
    type: String,
    description: 'Ссылка на сайт',
    required: true,
    example: 'https://example.com/',
  })
  @IsNotEmpty({
    message: 'Test site link is required',
  })
  @IsString()
  test_site: string;

  @ApiProperty({
    type: String,
    description: 'Bitrix ID пользователя',
    required: true,
    example: '23',
  })
  @IsNotEmpty({
    message: 'Assigned user id is required',
  })
  @IsString()
  assigned_id: string;
}
