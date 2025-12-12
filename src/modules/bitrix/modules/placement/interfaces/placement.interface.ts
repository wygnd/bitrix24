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
