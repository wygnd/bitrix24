import { IJivoWebhookVisitor } from '../interface';

export interface IB24JivoIntegrationWebhookRequest {
  event_name: string;
  visitor: IJivoWebhookVisitor;
}
