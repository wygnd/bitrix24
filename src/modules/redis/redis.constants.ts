export const REDIS_CLIENT = 'REDIS_CLIENT';

export const REDIS_KEYS = {
  BITRIX_REFRESH_TOKEN: 'bitrix:refresh_token',
  BITRIX_ACCESS_TOKEN: 'bitrix:access_token',
  BITRIX_ACCESS_EXPIRES: 'bitrix:access_expires',
  HEADHUNTER_ACCESS_TOKEN: 'hh:access_token',
  HEADHUNTER_WEBHOOK_NOTIFICATION: 'hh:webhook:'
};

export const REDIS_MAX_RETRY_DURATION = 5 * 60 * 1000;
