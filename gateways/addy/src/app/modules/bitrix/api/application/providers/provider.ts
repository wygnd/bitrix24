import { BitrixAdapter } from '../../infrastructure/adapters/adapter';
import { B24PORTS } from '../../../constants/ports/constant';
import { B24UseCase } from '../use-cases/use-case';

export const bitrixProviders = [
  { provide: B24PORTS.BITRIX_DEFAULT, useClass: BitrixAdapter },
  B24UseCase,
];
