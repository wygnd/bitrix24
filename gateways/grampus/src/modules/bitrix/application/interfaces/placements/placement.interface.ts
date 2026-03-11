export interface B24PlacementOptions {
  placement: string;
  userId: string | number;
  handler: string;
  options?: any[];
  title: string;
  description: string;
  langAll: any[];
}

export interface B24PlacementOptionsPlacementOptionsParsed {
  ID: string;
}

export interface B24PlacementQueryOptions {
  DOMAIN: string;
  PROTOCOL: string;
  LANG: string;
  APP_SID: string;
}

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

