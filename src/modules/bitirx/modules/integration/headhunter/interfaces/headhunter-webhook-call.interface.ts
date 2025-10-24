export interface HeadhunterWebhookCallInterface {
  id: string;
  payload: {
    topic_id: string;
    resume_id: string;
    vacancy_id: string;
    employer_id: string;
    response_date: string;
    chat_id: string;
  };
  subscription_id: string;
  action_type: string;
  user_id: string;
}
