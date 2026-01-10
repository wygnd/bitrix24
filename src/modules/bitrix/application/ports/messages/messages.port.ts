import {
  B24ImSendMessage,
  B24ImUpdateMessage,
} from '@/modules/bitrix/application/interfaces/messages/messages.interface';
import {
  B24ImNotifyUserOptions,
  B24ImNotifyUserTypes,
} from '@/modules/bitrix/application/interfaces/messages/messages-notify.inteface';

export interface BitrixMessagesPort {
  sendPrivateMessage(fields: B24ImSendMessage): Promise<number>;
  updateMessage(fields: B24ImUpdateMessage): Promise<boolean>;
  removeMessage(messageId: number): Promise<boolean>;
  notifyUser(
    type: B24ImNotifyUserTypes,
    options: B24ImNotifyUserOptions,
  ): Promise<number | null>;
}
