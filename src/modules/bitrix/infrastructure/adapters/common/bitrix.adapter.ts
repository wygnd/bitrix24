import { Injectable } from '@nestjs/common';
import {
  BitrixConfig,
  BitrixConstants,
} from '@/common/interfaces/bitrix-config.interface';
import { ConfigService } from '@nestjs/config';
import emojiStrip from 'emoji-strip';
import { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import {
  B24AvailableMethods,
  B24BatchCommands,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import {
  B24BatchResponseMap,
  B24SuccessResponse,
} from '@/modules/bitrix/interfaces/bitrix-api.interface';

@Injectable()
export class BitrixAdapter implements BitrixPort {
  private readonly bitrixConfig: BitrixConfig;
  private readonly bitrixConstants: BitrixConstants;

  constructor(
    private readonly configService: ConfigService,
    private readonly bitrixApiService: BitrixApiService,
  ) {
    const bitrixConstants =
      configService.get<BitrixConstants>('bitrixConstants');
    const bitrixConfig = configService.get<BitrixConfig>('bitrixConfig');

    if (!bitrixConfig) throw new Error('Invalid bitrix config');
    if (!bitrixConstants) throw new Error('Invalid bitrix constants');

    this.bitrixConfig = bitrixConfig;
    this.bitrixConstants = bitrixConstants;
  }

  /**
   * Return string url lead
   * @param leadId
   * @param label
   * @return string
   */
  public generateLeadUrl(leadId: number | string, label?: string) {
    const url = `${this.bitrixConfig.bitrixDomain}/crm/lead/details/${leadId}/`;

    if (label) return `[url=${url}]${label}[/url]`;

    return url;
  }

  /**
   * Return string url deals
   * @param dealId
   * @param label
   * @return string
   */
  public generateDealUrl(dealId: number | string, label?: string) {
    const url = `${this.bitrixConfig.bitrixDomain}/crm/deal/details/${dealId}/`;

    return label ? `[url=${url}]${label}[/url]` : url;
  }

  /**
   * Return string url task
   * @param userId
   * @param taskId
   * @param label
   */
  public generateTaskUrl(userId: string, taskId: string, label?: string) {
    const url = `https://grampus.bitrix24.ru/company/personal/user/${userId}/tasks/task/view/${taskId}/`;

    return label ? `[url=${url}]${label}[/url]` : url;
  }

  /**
   * Remove emoji from string
   *
   * ---
   *
   * Удаляет смайлы из строки
   *
   * @param message
   */
  public removeEmoji(message: string) {
    return emojiStrip(message) as string;
  }

  public formatPrice(
    price: number,
    locale: string = 'ru-RU',
    currency: string = 'RUB',
  ) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  public generateLeadUrlHtml(leadId: number | string, label?: string) {
    const url = `${this.bitrixConfig.bitrixDomain}/crm/lead/details/${leadId}/`;

    if (label) return `<a href="${url}">${label}</a>`;

    return `<a href="${url}">${url}</a>`;
  }

  public sortItemsByField<T = any>(items: T[], field: keyof T): T[] {
    return items.sort((prev, next) => {
      return prev[field] > next[field] ? 1 : next[field] > prev[field] ? -1 : 0;
    });
  }

  public clearBBCode(str: string) {
    return str.replaceAll(/\[.*?]/g, '');
  }

  public clearNumber(str: string) {
    return str.replaceAll(/[^0-9]/gi, '');
  }

  public getRandomElement<T = any>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
  }

  getConfig<T extends keyof BitrixConfig>(key: T): BitrixConfig[T] {
    return this.bitrixConfig[key];
  }

  getConstant<T extends keyof BitrixConstants>(key: T): BitrixConstants[T] {
    return this.bitrixConstants[key];
  }

  public isAvailableToDistributeOnManager() {
    return false;
  }

  public async callMethod<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(
    method: B24AvailableMethods,
    params: Partial<T> = {},
  ): Promise<B24SuccessResponse<U>> {
    return this.bitrixApiService.callMethod(method, params);
  }

  public async callBatch<T extends Record<string, any>>(
    commands: B24BatchCommands,
    halt: boolean = false,
  ): Promise<B24BatchResponseMap<T>> {
    return this.bitrixApiService.callBatch(commands, halt);
  }

  public async updateTokens() {
    return this.bitrixApiService.updateTokens();
  }
}
