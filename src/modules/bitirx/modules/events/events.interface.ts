import { BoolString, GenderString } from '@bitrix24/b24jssdk';
import { B24AuthOptions } from '../../interfaces/bitrix.interface';

export type B24EventList = 'ONIMCOMMANDADD' | 'ONAPPINSTALL';

export interface B24EventCommand {
  [key: number]: B24EventCommandOptions;
}

interface B24EventCommandOptions extends B24AuthOptions {
  client_id: string;
  AUTH: B24AuthOptions & { client_id: string };
  BOT_ID: number;
  BOT_CODE: string;
  COMMAND: string;
  COMMAND_ID: number;
  COMMAND_PARAMS: string;
  COMMAND_CONTEXT: string;
  MESSAGE_ID: number;
}

export interface B24EventParams {
  FROM_USER_ID: number;
  TO_CHAT_ID: number;
  MESSAGE: string;
  MESSAGE_TYPE: string;
  AUTHOR_ID: number;
  DIALOG_ID: string;
  MESSAGE_ID: number;
  CHAT_TYPE: string;
  LANGUAGE: string;
}

export interface B24EventUser {
  ID: number;
  NAME: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  WORK_POSITION: string;
  GENDER: GenderString;
}

export interface B24EventData {
  COMMAND: B24EventCommand;
  PARAMS: B24EventParams;
  USER: B24EventUser;
}

export interface B24EventBody {
  event: B24EventList;
  event_handler_id: number;
  data: {
    VERSION: number;
    ACTIVE: BoolString;
    INSTALLED: BoolString;
    LANGUAGE_ID: string;
  };
  ts: number;
  auth: B24AuthOptions;
}

export interface B24EventBodyOnInstallApp extends Omit<B24EventBody, 'event'> {
  event: 'ONAPPINSTALL';
}
