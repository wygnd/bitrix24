import { B24AddyClientsAddClientCommandHandler } from '../../../commands/addy/clients/add/handler';
import { B24AddyClientsUpdateClientCommandHandler } from '../../../commands/addy/clients/update/handler';
import { B24AddyClientsBulkUpdateClientsCommandHandler } from '../../../commands/addy/clients/update/bulk/handler';

export const bitrixAddyClientsCommandsProvider = [
  B24AddyClientsAddClientCommandHandler,
  B24AddyClientsUpdateClientCommandHandler,
  B24AddyClientsBulkUpdateClientsCommandHandler,
];
