import { TelphinExtensionGroup } from '@/modules/telphin/interfaces/telphin-extension-group.interface';
import { TelphinExtensionItem } from '@/modules/telphin/interfaces/telphin-extension.interface';

export interface B24WebhookVoxImplantCallStartOptions {
  callId: string;
  userId: string;
}

export interface B24WebhookVoxImplantCallInitOptions {
  callId: string;
  clientPhone: string;
}

export interface B24WebhookHandleCallInitForSaleManagersOptions {
  phone: string;
  extension: TelphinExtensionItem;
  group: TelphinExtensionGroup;
}
