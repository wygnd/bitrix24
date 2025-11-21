import { BitrixOptions } from '../interfaces/bitrix-config.interface';

export default (): BitrixOptions => ({
  bitrixConfig: {
    bitrixDomain: process.env.BITRIX_URL ?? '',
    bitrixClientId: process.env.BITRIX_CLIENT_ID ?? '',
    bitrixClientSecret: process.env.BITRIX_CLIENT_SECRET ?? '',
  },
  bitrixConstants: {
    BOT_ID: process.env.BOT_ID ?? '',
    TEST_CHAT_ID: process.env.BITRIX_TEST_CHAT_ID ?? '',
    WEBHOOK_INCOMING_TOKEN: process.env.BITRIX_INCOMING_WEBHOOK_TOKEN ?? '',
    WIDGET_REDIRECT_HR_RATIO_VACANCIES_URL:
      process.env.BITRIX_DATA_HR_RATIO_VACANCIES_REDIRECT_URL ?? '',
    ZLATA_ZIMINA_BITRIX_ID: process.env.BITRIX_DATA_ZIMINA_BITRIX_ID ?? '',
    HR: {
      hrChatId: process.env.BITRIX_DATA_HR_CHAT_ID ?? '',
    },
  },
});
