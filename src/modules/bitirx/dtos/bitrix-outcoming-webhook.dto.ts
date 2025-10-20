import {
  B24OutcomingWebhook,
  B24OutcomingWebhookAuth,
} from '../interfaces/bitrix-outcoming-webhook.interface';

export class BitrixOutcomingWebhookDto implements B24OutcomingWebhook {
  document_id: string[];
  auth: B24OutcomingWebhookAuth;
}
