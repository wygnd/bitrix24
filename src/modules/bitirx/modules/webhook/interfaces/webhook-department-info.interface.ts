export interface WebhookDepartmentInfo {
  stage: string;
  dealAssignedField: string;
  hideUsers: string[];
  chatId: string;
  category?: Record<string, string>;
}
