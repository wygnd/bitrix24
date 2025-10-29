export interface BitrixConfig {
  bitrixDomain: string;
  bitrixClientId: string;
  bitrixClientSecret: string;
}

export interface BitrixConstants {
  BOT_ID: string;
  TEST_CHAT_ID: string;
  WEBHOOK_INCOMING_TOKEN: string;
}

export interface BitrixOptions {
  bitrixConfig: BitrixConfig;
  bitrixConstants: BitrixConstants;
}
