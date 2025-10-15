import { BitrixConfig } from '../interfaces/bitrix-config.interface';

export default (): { bitrixConfig: BitrixConfig } => ({
  bitrixConfig: {
    bitrixDomain: process.env.BITRIX_URL ?? '',
    bitrixClientId: process.env.BITRIX_CLIENT_ID ?? '',
    bitrixClientSecret: process.env.BITRIX_CLIENT_SECRET ?? '',
  },
});
