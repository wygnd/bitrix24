import { HeadHunterConfig } from '@/common/interfaces/headhunter-config.interface';

export default (): { headHunterConfig: HeadHunterConfig } => ({
  headHunterConfig: {
    baseUrl: process.env.HH_API_URL ?? '',
    clientSecret: process.env.HH_CLIENT_SECRET ?? '',
    clientId: process.env.HH_CLIENT_ID ?? '',
    applicationToken: process.env.HH_APPLICATION_TOKEN ?? '',
    redirectUri: process.env.HH_REDIRECT_URI ?? '',
  },
});
