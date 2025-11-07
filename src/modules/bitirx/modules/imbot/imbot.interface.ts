import { B24ImKeyboardOptions } from '../im/interfaces/im.interface';

export interface B24ImbotRegisterCommand {
  BOT_ID: number;
  COMMAND: string;
  COMMON?: string;
  HIDDEN?: string;
  EXTRANET_SUPPORT?: string;
  LANG: B24ImbotCommandLanguageOptions[];
  EVENT_COMMAND_ADD: string;
}

export interface B24ImbotCommandLanguageOptions {
  LANGUAGE_ID: string;
  TITLE: string;
  PARAMS: string;
}

export interface B24ImbotSendMessageOptions {
  BOT_ID: string;
  DIALOG_ID: string | number;
  MESSAGE: string;
  KEYBOARD?: B24ImKeyboardOptions[];
  SYSTEM?: string;
  URL_PREVIEW?: string;
}

export interface B24ImbotRegisterOptions {
  CODE: string;
  TYPE: 'B' | 'O' | 'S';
  EVENT_HANDLER: string;
  OPENLINE?: string;
  CLIENT_ID?: string;
  PROPERTIES: B24BotProperties;
}

interface B24BotProperties {
  NAME: string;
  LAST_NAME?: string;
  COLOR?: string;
  EMAIL?: string;
  PERSONAL_BIRTHDAY?: string;
  WORK_POSITION?: string;
  PERSONAL_WWW?: string;
  PERSONAL_GENDER?: string;
  PERSONAL_PHOTO?: string;
}

export interface B24ImbotUnRegisterOptions {
  BOT_ID: number;
  CLIENT_ID?: string;
}
