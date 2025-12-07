import { AppConfig } from '@/common/interfaces/app-config.interface';

export default (): { config: AppConfig } => ({
  config: {
    apiKey: process.env.API_SECRET_KEY ?? '',
  },
});
