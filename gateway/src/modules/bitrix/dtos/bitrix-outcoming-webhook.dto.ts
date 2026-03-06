import type {
  B24OutcomingWebhook,
  B24OutcomingWebhookAuth,
} from '../interfaces/bitrix-outcoming-webhook.interface';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixOutcomingWebhookDto implements B24OutcomingWebhook {
  @ApiProperty({
    type: [String],
    description: 'Bitrix document entity',
    required: true,
    example: ['crm', 'ondDeal', 'DEAL_1235'],
  })
  document_id: string[];
  @ApiProperty({
    type: Object,
    description: 'Bitrix auth fields',
    required: true,
    example: {
      domain: 'example.com',
      client_endpoint: 'https://example.com',
      server_endpoint: 'htttp://example.com',
      member_id: '89673ewtf9g78sdgbfyg',
    },
  })
  auth: B24OutcomingWebhookAuth;
}
