export interface WebhookDepartmentInfo {
  stage: string;
  dealAssignedField: string;
  hideUsers: string[];
  chatId: string;
  nextChatId: string;
  category?: Record<string, string>;
}
