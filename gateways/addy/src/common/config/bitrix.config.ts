import { IEnvironmentBitrixOptions } from '@shared/interfaces/config/bitrix/main';

export default (): { bitrix: IEnvironmentBitrixOptions } => ({
  bitrix: {
    base_url: process.env.ADDY_GATEWAY_BITRIX_BASE_URL ?? '',
    client_id: process.env.ADDY_GATEWAY_BITRIX_CLIENT_ID ?? '',
    client_secret: process.env.ADDY_GATEWAY_BITRIX_CLIENT_SECRET ?? '',
    oauth_base_url: process.env.BITRIX_OAUTH_URL ?? '',
  },
});
