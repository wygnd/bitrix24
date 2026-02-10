import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import { BitrixConstants } from '@/common/interfaces/bitrix-config.interface';
import {
  B24AvailableMethods,
  B24BatchCommands,
} from '@/modules/bitrix/interfaces/bitrix.interface';

@Injectable()
export class BitrixUseCase {
  constructor(@Inject(B24PORTS.BITRIX) private readonly bitrix: BitrixPort) {}

  callMethod<T extends Record<string, any> = Record<string, any>, U = any>(
    method: B24AvailableMethods,
    params: Partial<T> = {},
  ) {
    return this.bitrix.callMethod<T, U>(method, params);
  }

  callBatch<T extends Record<string, any>>(
    commands: B24BatchCommands,
    halt: boolean = false,
  ) {
    return this.bitrix.callBatch<T>(commands, halt);
  }

  generateLeadUrl(leadId: number | string, label?: string) {
    return this.bitrix.generateLeadUrl(leadId, label);
  }

  generateLeadUrlHTML(leadId: number | string, label?: string) {
    return this.bitrix.generateLeadUrlHtml(leadId, label);
  }

  generateDealUrl(dealId: number | string, label?: string) {
    return this.bitrix.generateDealUrl(dealId, label);
  }

  generateTaskUrl(userId: string, taskId: string, label?: string) {
    return this.bitrix.generateTaskUrl(userId, taskId, label);
  }

  removeEmoji(message: string) {
    return this.bitrix.removeEmoji(message);
  }

  formatPrice(price: number, locale?: string, currency?: string) {
    return this.bitrix.formatPrice(price, locale, currency);
  }

  sortItemsByField<T>(items: T[], field: keyof T) {
    return this.bitrix.sortItemsByField(items, field);
  }

  clearBBCode(str: string) {
    return this.bitrix.clearBBCode(str);
  }

  clearNumber(str: string) {
    return this.bitrix.clearNumber(str);
  }

  getConstant<T extends keyof BitrixConstants>(key: T): BitrixConstants[T] {
    return this.bitrix.getConstant(key);
  }

  isAvailableToDistributeOnManager() {
    return this.bitrix.isAvailableToDistributeOnManager();
  }

  getRandomElement<T>(items: T[]) {
    return this.bitrix.getRandomElement(items);
  }

  updateTokens() {
    return this.bitrix.updateTokens();
  }

  async callBatches<T extends Record<string, any> = Record<string, any>>(
    commands: B24BatchCommands,
  ) {
    return this.bitrix.callBatches<T>(commands);
  }

  async callMethodV2<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(method: B24AvailableMethods, params?: Partial<T>) {
    return this.bitrix.callMethodV2(method, params);
  }
}
