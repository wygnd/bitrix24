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
  },
});
