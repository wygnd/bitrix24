import { BoolString } from '@bitrix24/b24jssdk';

export type KeyboardBgColorToken = 'primary' | 'secondary' | 'alert' | 'base';

export interface B24ImKeyboardOptions {
  TEXT?: string;
  LINK?: string;
  COMMAND?: string;
  COMMAND_PARAMS?: any;
  BG_COLOR_TOKEN?: KeyboardBgColorToken;
  BG_COLOR?: string;
  BLOCK?: BoolString;
  DISABLED?: BoolString;
  TEXT_COLOR?: string;
  DISPLAY?: 'BLOCK' | 'LINE';
  WIDTH?: string;
  ACTION?: string;
  ACTION_VALUE?: string;
  TYPE?: string;
}

export interface B24ImSendMessage {
  DIALOG_ID: string;
  MESSAGE: string;
  SYSTEM?: string;
  URL_PREVIEW?: BoolString;
  KEYBOARD?: B24ImKeyboardOptions[];
}

export interface B24ImRemoveMessage {
  MESSAGE_ID: string | number;
}

export interface B24ImUpdateMessage {
  MESSAGE_ID: string | number;
  MESSAGE: string;
  ATTACH?: string;
  URL_PREVIEW?: BoolString;
  KEYBOARD?: B24ImKeyboardOptions[];
}

export interface B24ImSendMessageResponseOptions {
  status: boolean;
  messageId: number;
}