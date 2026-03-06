import { AvitoConfig } from '@/common/interfaces/avito-config.interface';

export default (): { avitoConfig: AvitoConfig } => ({
  avitoConfig: {
    baseUrl: process.env.AVITO_BASE_URL ?? '',
  },
});
