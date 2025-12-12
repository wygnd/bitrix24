export interface B24PlacementWidgetCallCardOptions {
  AUTH_ID: string;
  AUTH_EXPIRES: string;
  REFRESH_ID: string;
  SERVER_ENDPOINT: string;
  member_id: string;
  status: string;
  PLACEMENT: string;
  PLACEMENT_OPTIONS: string;
}

export interface B24PlacementWidgetCallCardPlacementOptions {
  CALL_ID: string;
  PHONE_NUMBER: string;
  LINE_NUMBER: string;
  LINE_NAME: string;
  CRM_ENTITY_TYPE?: string;
  CRM_ENTITY_ID: string;
  CRM_ACTIVITY_ID: string;
  CRM_BINDINGS: B24PlacementWidgetCallCardPlacementOptionsBinding[];
  CALL_DIRECTION: string;
  CALL_STATE: string;
  CALL_LIST_MODE: string;
}

interface B24PlacementWidgetCallCardPlacementOptionsBinding {
  ENTITY_TYPE: string;
  ENTITY_ID: string;
}
