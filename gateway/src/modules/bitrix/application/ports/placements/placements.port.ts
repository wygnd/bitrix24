import {
  B24PlacementOptions,
  PlacementBindOptions,
  PlacementUnbindOptions,
} from '@/modules/bitrix/application/interfaces/placements/placement.interface';

export interface BitrixPlacementsPort {
  bind(params: PlacementBindOptions): Promise<boolean>;
  unbind(params: PlacementUnbindOptions): Promise<number>;
  getBoundPlacementList(): Promise<B24PlacementOptions[]>;
}
