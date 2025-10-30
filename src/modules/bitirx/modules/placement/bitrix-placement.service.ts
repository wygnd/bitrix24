import { Injectable } from '@nestjs/common';
import {
  PlacementBindOptions,
  PlacementUnbindOptions,
} from './placement.interface';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { PlacementUnbindDto } from '@/modules/bitirx/modules/placement/dtos/placement-unbind.dto';

@Injectable()
export class BitrixPlacementService {
  constructor(private readonly bitrixService: BitrixService) {}

  async bind(params: PlacementBindOptions) {
    return this.bitrixService.callMethod<PlacementBindOptions, boolean>(
      'placement.bind',
      params,
    );
  }

  async unbind(fields: PlacementUnbindDto) {
    return this.bitrixService.callMethod<
      PlacementUnbindOptions,
      { count: number }
    >('placement.unbind', fields);
  }
}
