import { BoolString } from '@bitrix24/b24jssdk';

type KeyboardBgColorToken = 'primary' | 'secondary' | 'alert' | 'base';

export interface B24ImKeyboardOptions {
  TEXT: string;
  LINK?: string;
  COMMAND?: string;
  COMMAND_PARAMS?: string;
  BG_COLOR_TOKEN?: KeyboardBgColorToken;
  BG_COLOR?: string;
  BLOCK?: BoolString;
  DISABLED?: BoolString;
  TEXT_COLOR?: string;
  DISPLAY?: 'BLOCK' | 'LINE';
  WIDTH?: string;
}

export interface B24ImSendMessage {
  DIALOG_ID: string;
  MESSAGE: string;
  SYSTEM?: boolean;
  URL_PREVIEW?: BoolString;
  KEYBOARD?: B24ImKeyboardOptions[];
}
