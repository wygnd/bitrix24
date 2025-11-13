import { WebhookUserItem } from '@/modules/bitirx/modules/webhook/interfaces/webhook-user.interface';

export interface WebhookDepartmentInfo {
  stage: string;
  dealAssignedField: string;
  hideUsers: string[];
  addUsers?: WebhookUserItem[];
  chatId: string;
  nextChatId: string;
  category?: Record<string, string>;
  distributedStageId: Record<string, string>;
}
