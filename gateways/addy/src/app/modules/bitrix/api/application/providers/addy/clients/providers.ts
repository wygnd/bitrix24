import { B24PORTS } from '../../../../../constants/ports/constant';
import { B24AddyClientsRepository } from '../../../../infrastructure/repositories/addy/clients/repository';

export const bitrixAddyClientsRepositoryProvider = {
  provide: B24PORTS.ADDY.ADDY_CLIENTS_REPO,
  useClass: B24AddyClientsRepository,
};
