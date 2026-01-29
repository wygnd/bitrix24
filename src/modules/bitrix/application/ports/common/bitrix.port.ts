import {
  BitrixConfig,
  BitrixConstants,
} from '@/common/interfaces/bitrix-config.interface';
import {
  B24AvailableMethods,
  B24BatchCommands,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import {
  B24BatchResponseMap,
  B24SuccessResponse,
} from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { BitrixTokens } from '@/modules/bitrix/interfaces/bitrix-auth.interface';

export interface BitrixPort {
  callMethod<T extends Record<string, any> = Record<string, any>, U = any>(
    method: B24AvailableMethods,
    params?: Partial<T>,
  ): Promise<B24SuccessResponse<U>>;
  callBatch<T extends Record<string, any>>(
    commands: B24BatchCommands,
    halt?: boolean,
  ): Promise<B24BatchResponseMap<T>>;
  updateTokens(): Promise<BitrixTokens>;
  generateLeadUrl(leadId: number | string, label?: string): string;
  generateDealUrl(dealId: number | string, label?: string): string;
  generateTaskUrl(userId: string, taskId: string, label?: string): string;
  generateLeadUrlHtml(leadId: number | string, label?: string): string;
  getConfig<T extends keyof BitrixConfig>(key: T): BitrixConfig[T];
  getConstant<T extends keyof BitrixConstants>(key: T): BitrixConstants[T];
  removeEmoji(message: string): string;
  formatPrice(price: number, locale?: string, currency?: string, display?: string): string;
  sortItemsByField<T>(items: T[], field: keyof T): T[];
  clearBBCode(str: string): string;
  clearNumber(str: string): string;
  getRandomElement<T>(items: T[]): T;
  isAvailableToDistributeOnManager(): boolean;
  callBatches<T extends Record<string, any>>(
    commands: B24BatchCommands,
  ): Promise<Record<string, T[keyof T]>>;
  checkBatchErrors<T extends Record<string, any> = Record<string, any>>(
    responses: B24BatchResponseMap<T>[],
  ): string[];
}
