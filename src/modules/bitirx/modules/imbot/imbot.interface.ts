import { B24LangList, BoolString } from '@bitrix24/b24jssdk';
import { B24ImKeyboardOptions } from '../im/im.interface';

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
  BOT_ID: number;
  DIALOG_ID: string;
  MESSAGE: string;
  KEYBOARD?: B24ImKeyboardOptions[];
  SYSTEM?: BoolString;
  URL_PREVIEW?: BoolString;
}
