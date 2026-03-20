import { Optional } from '@shared/types/optional';

export interface IB24AddyClientEntity {
  id: number;
  email: string;
  hasFirstContract: boolean;
  name: string;
  checkIn: string | null;
  status: TB24AddyClientStatus | null;
  wasHandled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TB24AddyClientCreationEntity = Omit<
  Optional<
    IB24AddyClientEntity,
    'hasFirstContract' | 'name' | 'checkIn' | 'wasHandled' | 'status'
  >,
  'id' | 'createdAt' | 'updatedAt'
>;

export type TB24AddyClientGetClient = 'email' | 'id';

export type TB24AddyClientUpdateEntity = Partial<TB24AddyClientCreationEntity>;

export interface IB24AddyClientBulkUpdate {
  clientId: number;
  fields: TB24AddyClientUpdateEntity;
}

export type TB24AddyClientStatus = 'not_found_lead' | 'handled' | 'exception' | 'not_updated-same_assigned';
