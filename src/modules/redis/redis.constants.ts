export const REDIS_CLIENT = 'REDIS_CLIENT';

export const REDIS_KEYS = {
  // BITRIX API
  BITRIX_REFRESH_TOKEN: 'bitrix:refresh_token',
  BITRIX_ACCESS_TOKEN: 'bitrix:access_token',
  BITRIX_ACCESS_EXPIRES: 'bitrix:access_expires',

  // HEAD HUNTER API
  HEADHUNTER_ACCESS_TOKEN: 'hh:access_token',
  HEADHUNTER_WEBHOOK_NOTIFICATION: 'hh:webhook:',
  HEADHUNTER_AUTH_DATA: 'hh:auth:data',
  HEADHUNTER_NEED_UPDATE_AUTH_SENDING: 'hh:auth:notification',
  HEADHUNTER_EMPLOYER_ID: 'hh:constants:employer_id',
  HEADHUNTER_API_ACTIVE_VACANCIES: 'hh:api:active_vacancies',

  // BITRIX DATA
  BITRIX_DATA_DEAL_FIELDS: 'bitrix:deal:fields'
};

export const REDIS_MAX_RETRY_DURATION = 5 * 60 * 1000;
