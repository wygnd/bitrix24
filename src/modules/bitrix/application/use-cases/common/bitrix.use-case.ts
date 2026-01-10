import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

@Injectable()
export class BitrixUseCase {
  constructor(@Inject(B24PORTS.BITRIX) private readonly bitrix: BitrixPort) {}
}
