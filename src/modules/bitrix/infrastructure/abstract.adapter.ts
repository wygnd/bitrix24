import { BitrixAbstractPort } from '@/modules/bitrix/application/ports/abstract.port';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';

export class BitrixAbstractAdapter implements BitrixAbstractPort {
  constructor(private readonly bitrix: BitrixService) {}

  async callBatch<T extends Record<string, any>>(
    commands: B24BatchCommands,
    halt: boolean = false,
  ): Promise<B24BatchResponseMap<T>> {
    return this.bitrix.callBatch<B24BatchResponseMap<T>>(commands, halt);
  }
}
