import { B24ImbotSendMessageOptions } from '@/modules/bitrix/modules/imbot/imbot.interface';

export interface ImbotCommand {
  id: string;
  name: string;
  command: string;
}
