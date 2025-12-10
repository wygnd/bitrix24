export interface PlacementBindOptions {
  PLACEMENT: string;
  HANDLER: string;
  TITLE: string;
  DESCRIPTION?: string;
  GROUP_NAME?: string;
  LANG_ALL: Record<string, B24LanguageOptions>;
  OPTIONS?: Record<string, any>;
}

export type B24LanguageOptions = {
  TITLE: string;
  DESCRIPTION: string;
  GROUP_NAME: string;
};

export interface PlacementUnbindOptions {
  PLACEMENT: string;
  HANDLER: string;
}

