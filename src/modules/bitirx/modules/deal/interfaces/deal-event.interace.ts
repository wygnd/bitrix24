import { B24EventBody } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';

export interface B24OnCRMDealUpdateEventData {
  FIELDS: {
    ID: string;
  };
}

export type B24OnCRMDealUpdateEvent = B24EventBody<B24OnCRMDealUpdateEventData>;
