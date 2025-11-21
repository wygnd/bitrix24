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
  HR: BitrixHRConstants;
}

export interface BitrixOptions {
  bitrixConfig: BitrixConfig;
  bitrixConstants: BitrixConstants;
}

export interface BitrixHRConstants {
  hrChatId: string;
}
