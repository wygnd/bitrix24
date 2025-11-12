import { IncomingWebhookDistributeDealDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook-distribute-deal.dto';

export interface QueueDistributeDeal extends IncomingWebhookDistributeDealDto {
  distributedStage: string;
}
