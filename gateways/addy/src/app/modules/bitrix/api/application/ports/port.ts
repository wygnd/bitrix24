import { IB24AvailableMethods } from '../../../interfaces/api/interface';
import { IB24Response } from '../../../interfaces/api/responses/interface';

export interface IB24Port {
  callMethod<T extends Record<string, any> = Record<string, any>, U = any>(
    method: IB24AvailableMethods,
    params?: Partial<T>,
  ): Promise<IB24Response<U>>;
  // callBatch<T extends Record<string, any>>(
  //   commands: B24BatchCommands,
  //   halt?: boolean,
  // ): Promise<B24BatchResponseMap<T>>;
  // updateTokens(): Promise<BitrixTokens>;
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
  // callBatches<T extends Record<string, any>>(
  //   commands: B24BatchCommands,
  // ): Promise<Record<string, T[keyof T]>>;
  // checkBatchErrors<T extends Record<string, any> = Record<string, any>>(
  //   responses: B24BatchResponseMap<T>[],
  // ): string[];

  // rest 3.0
  // callMethodV2<T extends Record<string, any> = Record<string, any>, U = any>(
  //   method: B24AvailableMethodsV2,
  //   params?: Partial<T>,
  // ): any;
}