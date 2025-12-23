import { B24DealCategories } from '@/modules/bitrix/interfaces/bitrix.interface';

export enum B24LeadUpsellStatuses {
  PENDING = 'pending',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export interface B24LeadUpsellAttributes {
  id: number;
  leadId: string;
  dealId: string;
  status: B24LeadUpsellStatuses;
  category: B24DealCategories;
  dateNotify: Date;
  dealStage: string;
}

export type B24LeadUpsellCreationalAttributes = Omit<
  B24LeadUpsellAttributes,
  'id'
>;

export interface B24LeadUpsellAddInQueueOptions {
  dealId: string;
  notified: number;
}

export interface B24LeadUpsellQuestionFieldOptionsMessages {
  fired: string;
  notWorking: string;
  working: string;
  additionalMessage?: {
    dialogId: string;
    message: string;
  };
}

export interface B24LeadUpsellQuestionFieldOptions {
  fields: string[];
  messages: B24LeadUpsellQuestionFieldOptionsMessages;
}

export type B24LeadUpsellQuestionsFields = {
  [K in keyof typeof B24DealCategories]: B24LeadUpsellQuestionFieldOptions;
};

export interface B24HandleUpsellOptions {
  upsellId: number;
  leadId: string;
  dealId: string;
  category: B24DealCategories;
  messages: B24LeadUpsellQuestionFieldOptionsMessages;
}
