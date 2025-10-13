import type { B24LangList } from '@bitrix24/b24jssdk';

export interface PlacementBindOptions {
  placement: string;
  handler: string;
  title: string;
  description: string;
  group_name: string;
  lang_all: Record<B24LangList, LanguageOptions>[];
}

type LanguageOptions = {
  title: string;
  description: string;
  group_name: string;
};
