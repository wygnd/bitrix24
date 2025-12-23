import { TelphinExtensionGroup } from '@/modules/telphin/interfaces/telphin-extension-group.interface';
import { TelphinExtensionItem } from '@/modules/telphin/interfaces/telphin-extension.interface';
import { TelphinCallItem } from '@/modules/telphin/interfaces/telphin-call.interface';

export interface B24WebhookVoxImplantCallStartOptions {
  callId: string;
  userId: string;
}

export interface B24WebhookVoxImplantCallInitTaskOptions {
  callId: string;
  phone: string;
}

export interface B24WebhookVoxImplantCallInitOptions {
  callId: string;
  clientPhone: string;
  extensionGroup: TelphinExtensionGroup;
  extensionCall: TelphinCallItem;
}

export interface B24WebhookHandleCallInitForSaleManagersOptions {
  phone: string;
  extension: TelphinExtensionItem;
  group: TelphinExtensionGroup;
  calls: TelphinCallItem[];
  called_did: string | null;
}

export interface B24WebhookHandleCallStartForSaleManagersOptions {
  userId: string;
  phone: string;
  calledDid: string | null;
}
