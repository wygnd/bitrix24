import {
  B24LangList,
  BoolString,
  GenderString,
  ISODate,
} from '@bitrix24/b24jssdk';
import { B24ImKeyboardOptions } from '../im/interfaces/im.interface';

export interface B24ImbotRegisterCommand {
  BOT_ID: number;
  COMMAND: string;
  COMMON?: BoolString;
  HIDDEN?: BoolString;
  EXTRANET_SUPPORT?: BoolString;
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
  SYSTEM?: BoolString;
  URL_PREVIEW?: BoolString;
}

export interface B24ImbotRegisterOptions {
  CODE: string;
  TYPE: 'B' | 'O' | 'S';
  EVENT: string;
  OPENLINE?: BoolString;
  CLIENT_ID?: string;
  PROPERTIES: B24BotProperties;
}

interface B24BotProperties {
  NAME: string;
  LAST_NAME: string;
  COLOR: string;
  EMAIL: string;
  PERSONAL_BIRTHDAY: ISODate;
  WORK_POSITION: string;
  PERSONAL_WWW: string;
  PERSONAL_GENDER: GenderString;
  PERSONAL_PHOTO: string;
}

export interface B24ImbotUnRegisterOptions {
  BOT_ID: number;
  CLIENT_ID?: string;
}
