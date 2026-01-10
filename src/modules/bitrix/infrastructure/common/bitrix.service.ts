import { Injectable } from '@nestjs/common';
import {
  BitrixConfig,
  BitrixConstants,
} from '@/common/interfaces/bitrix-config.interface';
import { ConfigService } from '@nestjs/config';
import emojiStrip from 'emoji-strip';

@Injectable()
export class BitrixService {
  private readonly bitrixConfig: BitrixConfig;
  private readonly bitrixConstants: BitrixConstants;
  private readonly avitoPhones = {
    '79585789931': 'Евгений Потехин',
    '79585789934': 'Иван Ильин',
    '79311215746': 'Лия Чешкова',
    '79311782698': 'Анна Резнова',
    '79585789985': 'Злата Зимина',
    '7931178213': 'Татьяна Галасимова',
    '79585707396': 'Кирилл Николаев',
    '79311079861': 'Светлана Соловьева',
    '79311082112': 'Дмитрий Андреев',
    '79311082208': 'Грампус',
    '79311082662': 'Илья Камнев',
    '79311082332': 'Анастасия Загоскина',
    '79311082552': 'Игорь Лебедев',
    '79311082772': 'Екатерина Кубарева',
    '79311092502': 'Ксения Лысманова',
    '79311093421': 'Ирина Наволоцкая',
    '79311093487': 'Анна Павликова',
    '79311215675': 'Полина Пешкова',
    '79311215679': 'Анна Теленкова',
    '79311215689': 'Иван Шевелёв',
    '79311215697': 'Дмитрий Шихирин',
    '79585707397': 'Дарья Романова',
    '79311782564': 'Анастасия Заварина',
  };

  constructor(private readonly configService: ConfigService) {
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
   * Get application bot id
   * @constructor
   */
  get BOT_ID() {
    return this.bitrixConstants.BOT_ID;
  }

  /**
   * Get bitrix chat id. Need for testing
   * @constructor
   */
  get TEST_CHAT_ID() {
    return this.bitrixConstants.TEST_CHAT_ID;
  }

  /**
   * Get token for validate incoming webhooks from bitrix
   * @constructor
   */
  get WEBHOOK_INCOMING_TOKEN() {
    return this.bitrixConstants.WEBHOOK_INCOMING_TOKEN;
  }

  /**
   * Returning Zlata Zimina bitrix user_id
   *
   * ---
   *
   * Возвращает ID Пользователя Битрикс24: Злата Зимина
   *
   * @constructor
   */
  get ZLATA_ZIMINA_BITRIX_ID() {
    return this.bitrixConstants.ZLATA_ZIMINA_BITRIX_ID;
  }

  get ADDY_CASES_CHAT_ID() {
    return this.bitrixConstants.ADDY.casesChatId;
  }

  get OBSERVE_MANAGER_CALLING_CHAT_ID() {
    return this.bitrixConstants.LEAD.observeManagerCallingChatId;
  }

  get WEBHOOK_VOXIMPLANT_FINISH_CALL_TOKEN() {
    return this.bitrixConstants.WEBHOOK.voxImplant.finishCallToken;
  }

  get WEBHOOK_VOXIMPLANT_INIT_CALL_TOKEN() {
    return this.bitrixConstants.WEBHOOK.voxImplant.initCallToken;
  }

  get WEBHOOK_VOXIMPLANT_START_CALL_TOKEN() {
    return this.bitrixConstants.WEBHOOK.voxImplant.startCallToken;
  }

  get UPSELL_CHAT_ID() {
    return this.bitrixConstants.LEAD.upsellChatId;
  }

  get AVITO_PHONES() {
    return this.avitoPhones;
  }

  public getAvitoName(phone: string): string | null {
    return phone in this.avitoPhones ? this.avitoPhones[phone] : null;
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

  public generateLeadUrlHtml(leadId: string, label?: string) {
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
}
