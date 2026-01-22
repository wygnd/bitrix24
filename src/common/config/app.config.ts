import { AppConfig } from '@/common/interfaces/app-config.interface';

export default (): { config: AppConfig } => ({
  config: {
    apiKey: process.env.API_SECRET_KEY ?? '',
    helpersApiKey: process.env.HELPERS_API_SECRET_KEY ?? '',
    apiOptions: {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    },
  },
});
