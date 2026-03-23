import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Page } from 'playwright';
import { chromium } from 'playwright-extra';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import stealth from 'puppeteer-extra-plugin-stealth';
import { maybeCatchError } from '@shared/utils/catch-error';
import { IYandexDirectQueryParams } from '../../../interfaces/yandex/direct/request/invoice.interface';
import { WinstonLogger } from '@shared/logger/main';
import { base64Encode } from '@shared/utils/base64-encode';
import { IS_PROD } from '@common/config/main';

@Injectable()
export class YandexDirectInvoiceService {
  private readonly logger = new WinstonLogger(
    YandexDirectInvoiceService.name,
    'yandex/direct',
  );
  private readonly saveScreenshotsPath = join(
    process.cwd(),
    'uploads',
    'screenshots',
  );
  private readonly saveFilesPath = join(process.cwd(), 'uploads', 'files');

  constructor() {
    if (!existsSync(this.saveScreenshotsPath)) {
      mkdirSync(this.saveScreenshotsPath, { recursive: true });
    }
    if (!existsSync(this.saveFilesPath)) {
      mkdirSync(this.saveFilesPath, { recursive: true });
    }
  }

  /**
   * Генерирует
   * @param fields
   */
  public async getInvoiceNumber(fields: IYandexDirectQueryParams) {
    try {
      const uuid = Date.now().toString();
      const { invoice_url, need_file = false } = fields;

      chromium.use(stealth());
      const browser = await chromium.launch({
        headless: IS_PROD,
        slowMo: 936,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
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

      await page.screenshot({
        path: join(this.saveScreenshotsPath, uuid, 'main-page.png'),
      });

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

      let fileData: string | null = null;
      await page.screenshot({
        path: join(this.saveScreenshotsPath, uuid, 'modal.png'),
      });

      if (need_file) {
        const downloadElement = await page.waitForSelector(
          '.yb-paystep-success__download',
          {
            timeout: 30000,
            state: 'visible',
          },
        );

        if (downloadElement) {
          try {
            const downloadPromise = page.waitForEvent('download');
            await downloadElement.click();

            const download = await downloadPromise;
            const filePath = join(
              this.saveFilesPath,
              uuid,
              download.suggestedFilename(),
            );

            await download.saveAs(filePath);
            fileData = base64Encode(filePath);
          } catch (error) {
            this.logger.error({
              handler: this.getInvoiceNumber.name,
              message: 'Ошибка получения файла',
              error: maybeCatchError(error),
            });

            fileData = null;
          }
        }
      }

      page
        .waitForSelector('.yb-user-popup__btn-close')
        .then(async (element) => {
          await page.waitForTimeout(2000);
          await element.click();
          await browser.close();
        });

      return {
        status: true,
        invoice_number: await invoiceNumber.textContent(),
        file_data: fileData,
      };
    } catch (error) {
      const errorData = maybeCatchError(error);

      this.logger.log(`Invalid get invoice number: ${errorData}`, 'error');
      this.logger.error({
        handler: this.getInvoiceNumber.name,
        request: fields,
        error: errorData,
      });
      throw error;
    }
  }

  private checkSession(page: Page): boolean {
    const targetUrl = page.url();

    return targetUrl.includes('passport.yandex');
  }
}
