import type { B24HookParams } from '@bitrix24/b24jssdk';

export default (): { bitrixConfig: B24HookParams } => ({
  bitrixConfig: {
    b24Url: process.env.BITRIX_URL ?? '',
    userId: process.env.BITRIX_USER_ID ? +process.env.BITRIX_USER_ID : 0,
    secret: process.env.BITRIX_SECRET ?? '',
  },
});
