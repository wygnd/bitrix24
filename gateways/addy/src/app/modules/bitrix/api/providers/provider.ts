import { BitrixAdapter } from '../infrastructure/adapters/adapter';
import { B24PORTS } from '../constants/ports/constant';

export const bitrixProviders = [
  { provide: B24PORTS.BITRIX_DEFAULT, useClass: BitrixAdapter },
];
