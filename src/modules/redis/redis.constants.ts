export const REDIS_CLIENT = 'REDIS_CLIENT';

export const REDIS_KEYS = {
  // BITRIX API
  BITRIX_REFRESH_TOKEN: 'bitrix:refresh_token',
  BITRIX_ACCESS_TOKEN: 'bitrix:access_token',
  BITRIX_ACCESS_EXPIRES: 'bitrix:access_expires',

  // BITRIX DATA
  BITRIX_DATA_DEAL_FIELDS: 'bitrix:deals:fields',
  BITRIX_DATA_DEAL_FIELD: 'bitrix:deals:field:',
  BITRIX_DATA_RATIO_VACANCY: 'bitrix:deals:hr:ratio:vacancy:',
  BITRIX_DATA_DEAL_ITEM: 'bitrix:deals:item:',
  BITRIX_DATA_BOT_COMMANDS: 'bitrix:bot:commands',
  BITRIX_DATA_USER_DEPARTMENTS: 'bitrix:user:departments',
  BITRIX_DATA_DEPARTMENT_LIST: 'bitrix:department:list',
  BITRIX_DATA_DEPARTMENT_HEAD_USERS: 'bitrix:department:advert:head:users',
  BITRIX_DATA_TASK_ITEM: 'bitrix:task:item:',
  BITRIX_DATA_LEAD_DUPLICATE_BY_PHONE: 'bitrix:lead:duplicate:phone:',
  BITRIX_DATA_WEBHOOK_VOXIMPLANT_CALL_INIT: 'bitrix:webhook:voximplant:init:',
  BITRIX_DATA_WEBHOOK_VOXIMPLANT_CALL_START: 'bitrix:webhook:voximplant:start:',

  // BITRIX WIDGET
  BITRIX_WIDGET_CALL_CARD: 'bitrix:widget:call_card:',

  // HEAD HUNTER API
  HEADHUNTER_ACCESS_TOKEN: 'hh:access_token',
  HEADHUNTER_WEBHOOK_NOTIFICATION: 'hh:webhook:',
  HEADHUNTER_AUTH_DATA: 'hh:auth:data',
  HEADHUNTER_NEED_UPDATE_AUTH_SENDING: 'hh:auth:notification',
  HEADHUNTER_EMPLOYER_ID: 'hh:constants:employer_id',
  HEADHUNTER_API_ACTIVE_VACANCIES: 'hh:api:active_vacancies',
  HEADHUNTER_DATA_RESUME: 'hh:data:resume:',
  HEADHUNTER_DATA_VACANCY: 'hh:data:vacancy:',
  HEADHUNTER_DATA_RESUME_ACTIVITY: 'hh:data:resume:activity:',

  // WIKI
  WIKI_WORKING_SALES: 'wiki:sales:working',

  // APPLICATION
  APPLICATION_TOKEN_BY_SERVICE: 'application:token:',

  // TELPHIN
  TELPHIN_USER_INFO: 'telphin:user:info',
  TELPHIN_EXTENSION_LIST: 'telphin:extension:list',
  TELPHIN_EXTENSION_ITEM: 'telphin:extension:item:',
  TELPHIN_EXTENSION_ITEM_BY_BITRIX_ID: 'telphin:extension:item:bitrix_id:',
  TELPHIN_EXTERNAL_PHONE_LIST: 'telphin:external:phone:list',
  TELPHIN_EXTENSION_GROUP_LIST: 'telphin:extension:group:list',
};

export const REDIS_MAX_RETRY_DURATION = 5 * 60 * 1000;
