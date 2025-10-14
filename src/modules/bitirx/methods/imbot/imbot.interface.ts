import { B24LangList, BoolString } from '@bitrix24/b24jssdk';

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
  LANGUAGE_ID: B24LangList;
  TITLE: string;
  PARAMS: string;
}
