import { BitrixConfig } from '../interfaces/bitrix-config.interface';

export default (): Record<string, any> & { bitrixConfig: BitrixConfig } => ({
  bitrixConfig: {
    bitrixDomain: process.env.BITRIX_URL ?? '',
    bitrixClientId: process.env.BITRIX_CLIENT_ID ?? '',
    bitrixClientSecret: process.env.BITRIX_CLIENT_SECRET ?? '',
  },
  bitrixConstants: {
    BOT_ID: process.env.BOT_ID,
  },
});
