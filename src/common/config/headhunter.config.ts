import { HeadHunterConfig } from '@/common/interfaces/headhunter-config.interface';

export default (): { headHunterConfig: HeadHunterConfig } => ({
  headHunterConfig: {
    baseUrl: process.env.HH_API_URL ?? '',
    clientSecret: process.env.HH_CLIENT_SECRET ?? '',
    clientId: process.env.HH_CLIENT_ID ?? '',
    redirectUri: process.env.HH_REDIRECT_URI ?? '',
  },
});
