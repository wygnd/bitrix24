import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Page } from 'playwright';
import { chromium } from 'playwright-extra';
import { join } from 'path';
import stealth from 'puppeteer-extra-plugin-stealth';
import { maybeCatchError } from '../../../../shared/utils/catch-error';
import { IYandexDirectQueryParams } from '../../../interfaces/yandex/direct/request/invoice.interface';
import { WinstonLogger } from '../../../../shared/logger/main';

@Injectable()
export class YandexDirectInvoiceService {
  private readonly logger = new WinstonLogger(
    YandexDirectInvoiceService.name,
    'yandex/direct',
  );

  constructor() {}

  /**
   * Генерирует
   * @param fields
   */
  public async getInvoiceNumber(fields: IYandexDirectQueryParams) {
    try {
      const { invoice_url } = fields;

      chromium.use(stealth());
      const browser = await chromium.launch({
        headless: true,
        slowMo: 936,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
      });
      const context = await browser.newContext({
        storageState: join(process.cwd(), 'sessions', 'yandex_auth.json'),
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: {
          width: 1920,
          height: 1080,
        },
      });

      await context.addInitScript(
        "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });",
      );
      const page = await context.newPage();

      await page.goto(invoice_url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      await page.mouse.move(326, 124);
      await page.waitForTimeout(3000);

      if (this.checkSession(page)) {
        throw new UnprocessableEntityException('Сессия истекла');
      }

      const generateInvoiceButton = await page.waitForSelector(
        "button[class='Button2 Button2_size_l Button2_type_submit Button2_view_action Button2_width_max'][type='submit']",
        {
          timeout: 30000,
          state: 'visible',
        },
      );

      await page.mouse.move(1054, 356);
      await page.waitForTimeout(2000);
      await context.storageState({
        path: join(process.cwd(), 'sessions', 'yandex_auth_new.json'),
      });

      if (!generateInvoiceButton) {
        await page.screenshot({
          path: join(
            process.cwd(),
            'sessions',
            'screenshots',
            'not_found_button.png',
          ),
        });
        throw new NotFoundException('Кнопка не найдена');
      }

      await generateInvoiceButton.click();
      await page.mouse.move(682, -190);
      await page.waitForTimeout(5000);

      const invoiceNumber = await page.waitForSelector(
        '.yb-success-header__id',
        {
          timeout: 30000,
          state: 'visible',
        },
      );

      if (!invoiceNumber) {
        await page.screenshot({
          path: join(
            process.cwd(),
            'sessions',
            'screenshots',
            'not_found_invoice_number.png',
          ),
        });
        throw new NotFoundException('Номер счета не найден');
      }

      return {
        status: true,
        invoice_number: await invoiceNumber.textContent(),
      };
    } catch (error) {
      this.logger.error({
        handler: this.getInvoiceNumber.name,
        request: fields,
        error: maybeCatchError(error),
      });
      throw error;
    }
  }

  private checkSession(page: Page): boolean {
    const targetUrl = page.url();

    return targetUrl.includes('passport.yandex');
  }
}
