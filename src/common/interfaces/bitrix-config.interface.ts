export interface BitrixConfig {
  bitrixDomain: string;
  bitrixClientId: string;
  bitrixClientSecret: string;
}

export interface BitrixConstants {
  BOT_ID: string;
  TEST_CHAT_ID: string;
  WEBHOOK_INCOMING_TOKEN: string;
  WIDGET_REDIRECT_HR_RATIO_VACANCIES_URL: string;
  ZLATA_ZIMINA_BITRIX_ID: string;
  ADDY: BitrixAddyConstants;
  HR: BitrixHRConstants;
  avito: BitrixAvitoConstants;
  LEAD: BitrixLEADConstants;
  WEBHOOK: BitrixWebhookConstants;
  GRAMPUS: BitrixGrampusOptions;
}

export interface BitrixOptions {
  bitrixConfig: BitrixConfig;
  bitrixConstants: BitrixConstants;
}

export interface BitrixHRConstants {
  hrChatId: string;
}

export interface BitrixAvitoConstants {
  avitoAiChatId: string;
}

export interface BitrixAddyConstants {
  casesChatId: string;
  support: BitrixAddySupportOptions;
  payment: BitrixAddyPaymentOptions;
}

export interface BitrixAddySupportOptions {
  bitrixChatId: string;
}

export interface BitrixAddyPaymentOptions {
  bitrixChatId: string;
}

export interface BitrixLEADConstants {
  observeManagerCallingChatId: string;
  upsellChatId: string;
}

export interface BitrixWebhookConstants {
  voxImplant: BitrixWebhookConstantsVoxImplantOptions;
}

export interface BitrixWebhookConstantsVoxImplantOptions {
  finishCallToken: string;
  initCallToken: string;
  startCallToken: string;
}

export interface BitrixGrampusOptions {
  trafficsChatId: string;
  GPayChatId: string;
}
