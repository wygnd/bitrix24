import { TelphinConfig } from '@/common/interfaces/telphin-config.interface';

export default (): { telphinConfig: TelphinConfig } => ({
  telphinConfig: {
    baseUrl: process.env.TELPHIN_BASE_URL ?? '',
    clientId: process.env.TELPHIN_CLIENT_ID ?? '',
    clientSecret: process.env.TELPHIN_CLIENT_SECRET ?? '',
  },
});
