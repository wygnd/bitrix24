export const QUEUE_NAMES = {
  QUEUE_BITRIX_TEST: 'bitrixTest',
  QUEUE_BITRIX_LIGHT: 'bitrixLight',
  QUEUE_BITRIX_MIDDLE: 'bitrixMiddle',
  QUEUE_BITRIX_HEAVY: 'bitrixHeavy',
};

export const QUEUE_TASKS = {
  LIGHT: {
    QUEUE_BX_EVENTS_SEND_WIKI_ON_LEAD_DELETE:
      'bitrix:events:wiki:send_request_on_delete_lead',
    QUEUE_BX_TASK_UPDATE: 'bxTaskUpdate',
  },
  MIDDLE: {
    QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO:
      'bitrix:integration:avito:client_request',
  },
  HEAVY: {},
  QUEUE_BX_TEST: 'bitrix:task:test',
};
