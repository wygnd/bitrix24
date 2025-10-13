import { BoolString } from '@bitrix24/b24jssdk';

enum KeyboardBgColorToken {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ALERT = 'alert',
  BASE = 'base',
}

interface B24ImKeyboardOptions {
  TEXT: string;
  LINK?: string;
  COMMAND: string;
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
  SYSTEM: boolean;
  URL_PREVIEW: BoolString;
  KEYBOARD: B24ImKeyboardOptions;
}
