import { IAddyInternalConfigOptions } from '@/common/interfaces/addy-internal-config.interface';

export default (): { addy_internal: IAddyInternalConfigOptions } => ({
  addy_internal: {
    baseUrl: process.env.ADDY_INTERNAL_BASE_URL ?? '',
    auth: {
      login: process.env.ADDY_INTERNAL_LOGIN ?? '',
      password: process.env.ADDY_INTERNAL_PASSWORD ?? '',
    },
  },
});
