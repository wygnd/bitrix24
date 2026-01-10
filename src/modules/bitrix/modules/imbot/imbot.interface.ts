import { B24ImKeyboardOptions } from '../../application/interfaces/messages/messages.interface';

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
  PARAMS?: string;
}

export interface B24ImbotSendMessageOptions {
  BOT_ID: string;
  DIALOG_ID: string | number;
  MESSAGE: string;
  KEYBOARD?: B24ImKeyboardOptions[] | string;
  SYSTEM?: string;
  URL_PREVIEW?: string;
}

export type B24ImbotUpdateMessageOptions = Omit<
  B24ImbotSendMessageOptions,
  'DIALOG_ID'
> & {
  MESSAGE_ID: number;
};

export interface B24ImbotRegisterOptions {
  CODE: string;
  TYPE: 'B' | 'O' | 'S';
  EVENT_HANDLER: string;
  OPENLINE?: string;
  CLIENT_ID?: string;
  PROPERTIES: B24BotProperties;
}

export interface B24BotProperties {
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
  BOT_ID: string | number;
  CLIENT_ID?: string;
}
