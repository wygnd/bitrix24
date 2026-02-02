import { GrampusConfig } from '@/common/interfaces/grampus-config.interface';

export default (): { grampusConfig: GrampusConfig } => ({
  grampusConfig: {
    baseUrl: process.env.GRAMPUS_BASE_URL ?? '',
  },
});
