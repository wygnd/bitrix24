import { IYandexConfig } from '@/common/interfaces/yandex-config.interface';

export default (): { yandex: IYandexConfig } => ({
  yandex: {
    metrika: {
      token: process.env.YANDEX_METRIKA_AUTH_TOKEN ?? '',
      baseUrl: process.env.YANDEX_METRIKA_BASE_URL ?? '',
      counters: {
        grampus: process.env.YANDEX_METRIKA_COUNTERS_GRAMPUS ?? '',
        med: process.env.YANDEX_METRIKA_COUNTERS_MED_GRAMPUS ?? '',
      },
    },
  },
});
