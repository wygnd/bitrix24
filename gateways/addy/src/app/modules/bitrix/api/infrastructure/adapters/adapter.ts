import { Injectable } from '@nestjs/common';
import { IB24Port } from '../../application/ports/port';
import {
  IB24AvailableMethods,
  TB24BatchCommands,
} from '../../../interfaces/api/interface';
import {
  IB24BatchResponseMap,
  IB24Response,
} from '../../../interfaces/api/responses/interface';
import emojiStrip from 'emoji-strip';
import { BitrixApiService } from '../../../services/auth/service';
import { ConfigService } from '@nestjs/config';
import { IEnvironmentOptions } from '@shared/interfaces/config/main';

@Injectable()
export class BitrixAdapter implements IB24Port {
  private readonly bitrixDomain: string;

  constructor(
    private readonly configService: ConfigService<IEnvironmentOptions>,
    private readonly bitrixApiService: BitrixApiService,
  ) {
    this.bitrixDomain = this.configService.getOrThrow('bitrix.base_url', {
      infer: true,
    });
  }

  /**
   * Return string url lead
   * @param leadId
   * @param label
   * @return string
   */
  public generateLeadUrl(leadId: number | string, label?: string) {
    const url = `${this.bitrixDomain}/crm/lead/details/${leadId}/`;

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
    const url = `${this.bitrixDomain}/crm/deal/details/${dealId}/`;

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
    currencyDisplay: 'name' | 'symbol' | 'code' = 'symbol',
  ) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: currencyDisplay,
    }).format(price);
  }

  /**
   * Generate html bitrix lead url
   *
   * ---
   *
   * Формирует html ссылку на лид
   * @example <a href="https://bitrix.com">https://bitrix.com</a>
   * @param leadId
   * @param label
   */
  public generateLeadUrlHtml(leadId: number | string, label?: string) {
    const url = `${this.bitrixDomain}/crm/lead/details/${leadId}/`;

    if (label) return `<a href="${url}">${label}</a>`;

    return `<a href="${url}">${url}</a>`;
  }

  public sortItemsByField<T = any>(items: T[], field: keyof T): T[] {
    return items.sort((prev, next) => {
      return prev[field] > next[field] ? 1 : next[field] > prev[field] ? -1 : 0;
    });
  }

  /**
   * Clear BB code from string
   *
   * ---
   *
   * Отчищает строку от BB кода
   * @example [b]string[/b] => string
   * @param str
   */
  public clearBBCode(str: string) {
    return str.replaceAll(/\[.*?]/g, '');
  }

  /**
   * Clear number string
   *
   * ---
   *
   * Отчищает число из строки
   * @example ИНН: 123 => 123
   * @param str
   */
  public clearNumber(str: string) {
    return str.replaceAll(/[^0-9]/gi, '');
  }

  public getRandomElement<T = any>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Return boolean metric is available to distribute on sales manager
   *
   * ---
   *
   * Возвращает булевое значение, обозначающее можно ли распределять на менеджеров
   */
  public isAvailableToDistributeOnManager() {
    const now = new Date();

    return (
      now.getDay() > 0 &&
      now.getDay() < 6 &&
      ((now.getUTCHours() >= 6 && now.getUTCHours() < 14) ||
        (now.getUTCHours() === 14 && now.getUTCMinutes() <= 30))
    );
  }

  /**
   * Base method to do with bitrix rest api
   *
   * ---
   *
   * Основной метод для взаимодействия с bitrix api
   * @param method
   * @param params
   */
  public async callMethod<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(
    method: IB24AvailableMethods,
    params: Partial<T> = {},
  ): Promise<IB24Response<U>> {
    return this.bitrixApiService.callMethod(method, params);
  }

  /**
   * Like callMethod but send batch request
   *
   * ---
   *
   * Похож на callMethod, но отправляет сразу пакет запросов
   * @param commands
   * @param halt
   */
  public async callBatch<T extends Record<string, any>>(
    commands: TB24BatchCommands,
    halt: boolean = false,
  ): Promise<IB24BatchResponseMap<T>> {
    return this.bitrixApiService.callBatch(commands, halt);
  }
}
