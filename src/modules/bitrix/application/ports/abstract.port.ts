import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';

export interface BitrixAbstractPort {
  callBatch<T extends Record<string, any>>(
    commands: B24BatchCommands,
    halt?: boolean,
  ): Promise<B24BatchResponseMap<T>>;
}
