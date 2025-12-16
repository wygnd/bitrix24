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
    ADDY: {
      casesChatId: process.env.BITRIX_DATA_ADDY_CASES_CHAT_ID ?? '',
      support: {
        bitrixChatId: process.env.BITRIX_DATA_ADDY_SUPPORT_CHAT_ID ?? '',
      },
      payment: {
        bitrixChatId: process.env.BITRIX_DATA_ADDY_PAYMENT_CHAT_ID ?? '',
      },
    },
    HR: {
      hrChatId: process.env.BITRIX_DATA_HR_CHAT_ID ?? '',
    },
    avito: {
      avitoAiChatId: process.env.BITRIX_DATA_AVITO_AI_CHAT_ID ?? '',
    },
    LEAD: {
      observeManagerCallingChatId:
        process.env.BITRIX_DATA_LEAD_OBSERVE_MANAGER_CALLING_CHAT_ID ?? '',
      upsellChatId: process.env.BITRIX_DATA_LEAD_UPSELL_CHAT_ID ?? '',
    },
    WEBHOOK: {
      voxImplant: {
        finishCallToken:
          process.env.BITRIX_DATA_WEBHOOK_VOXIMPLANT_FIHISH_CALL_TOKEN ?? '',
      },
    },
  },
});
