import { B24BotEventBody } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';

export interface B24OnCRMDealUpdateEventData {
  FIELDS: {
    ID: string;
  };
}

export type B24OnCRMDealUpdateEvent = B24BotEventBody<B24OnCRMDealUpdateEventData>;
