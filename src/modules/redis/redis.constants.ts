export const REDIS_CLIENT = 'REDIS_CLIENT';

export const REDIS_KEYS = {
  // BITRIX API
  BITRIX_REFRESH_TOKEN: 'bitrix:refresh_token',
  BITRIX_ACCESS_TOKEN: 'bitrix:access_token',
  BITRIX_ACCESS_EXPIRES: 'bitrix:access_expires',

  // BITRIX DATA
  BITRIX_DATA_DEAL_FIELDS: 'bitrix:deal:fields',
  BITRIX_DATA_DEAL_FIELD: 'bitrix:deal:field:',
  BITRIX_DATA_RATIO_VACANCIES: 'bitrix:deal:hr:ratio:vacancies',
  BITRIX_DATA_DEAL_ITEM: 'bitrix:deal:item:',
  BITRIX_DATA_BOT_COMMANDS: 'bitrix:bot:commands',
  BITRIX_DATA_USER_DEPARTMENTS: 'bitrix:user:departments',
  BITRIX_DATA_DEPARTMENT_LIST: 'bitrix:department:list',
  BITRIX_DATA_DEPARTMENT_HEAD_USERS: 'bitrix:department:advert:head:users',
  BITRIX_DATA_TASK_ITEM: 'bitrix:task:item:',
  BITRIX_DATA_LEAD_DUPLICATE_BY_PHONE: 'bitrix:lead:duplicate:phone:',

  // HEAD HUNTER API
  HEADHUNTER_ACCESS_TOKEN: 'hh:access_token',
  HEADHUNTER_WEBHOOK_NOTIFICATION: 'hh:webhook:',
  HEADHUNTER_AUTH_DATA: 'hh:auth:data',
  HEADHUNTER_NEED_UPDATE_AUTH_SENDING: 'hh:auth:notification',
  HEADHUNTER_EMPLOYER_ID: 'hh:constants:employer_id',
  HEADHUNTER_API_ACTIVE_VACANCIES: 'hh:api:active_vacancies',
  HEADHUNTER_DATA_RESUME: 'hh:data:resume:',
  HEADHUNTER_DATA_VACANCY: 'hh:data:vacancy:',
};

export const REDIS_MAX_RETRY_DURATION = 5 * 60 * 1000;
