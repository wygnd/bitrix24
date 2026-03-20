import {
  IB24AvailableMethods,
  TB24BatchCommands,
} from '../../../interfaces/api/interface';
import {
  IB24BatchResponseMap,
  IB24Response,
} from '../../../interfaces/api/responses/interface';

export interface IB24Port {
  callMethod<T extends Record<string, any> = Record<string, any>, U = any>(
    method: IB24AvailableMethods,
    params?: Partial<T>,
  ): Promise<IB24Response<U>>;
  callBatch<T extends Record<string, any>>(
    commands: TB24BatchCommands,
    halt?: boolean,
  ): Promise<IB24BatchResponseMap<T>>;
  generateLeadUrl(leadId: number | string, label?: string): string;
  generateDealUrl(dealId: number | string, label?: string): string;
  generateTaskUrl(userId: string, taskId: string, label?: string): string;
  generateLeadUrlHtml(leadId: number | string, label?: string): string;
  removeEmoji(message: string): string;
  formatPrice(
    price: number,
    locale?: string,
    currency?: string,
    display?: string,
  ): string;
  sortItemsByField<T>(items: T[], field: keyof T): T[];
  clearBBCode(str: string): string;
  clearNumber(str: string): string;
  getRandomElement<T>(items: T[]): T;
  isAvailableToDistributeOnManager(): boolean;
  callBatches<T extends Record<string, any>>(
    commands: TB24BatchCommands,
  ): Promise<Record<string, T[keyof T]>>;
}
