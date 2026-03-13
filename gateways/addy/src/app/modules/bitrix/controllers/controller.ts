import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { WinstonLogger } from '@shared/logger/winston.logger';
import { maybeCatchError } from '@shared/utils/catch-error';
import type { IB24InstallAppBodyOptions } from '../interfaces/api/requests/interface';
import { BitrixApiService } from '../services/auth/service';

@ApiExcludeController()
@Controller({
  version: '1',
  path: 'bitrix',
})
export class BitrixController {
  private readonly logger = new WinstonLogger(
    BitrixController.name,
    'bitrix/app',
  );

  constructor(private readonly bitrixService: BitrixApiService) {}

  @Post('/app/install')
  public async handleInstallApp(@Body() body: IB24InstallAppBodyOptions) {
    try {
      await this.bitrixService.saveTokens({
        access_token: body.auth.access_token,
        refresh_token: body.auth.refresh_token,
        expires: body.auth.expires * 1000,
      });

      await this.bitrixService.callMethod('im.message.add', {
        DIALOG_ID: 'chat84',
        MESSAGE: `Установка приложения [b](Node)![/b][br][br]${JSON.stringify(body) ?? ''}`,
        SYSTEM: 'Y',
      });

      return {
        status: true,
      };
    } catch (err) {
      this.logger.error({
        handler: this.handleInstallApp.name,
        error: maybeCatchError(err),
      });
      return {
        status: false,
      };
    }
  }

  @Post('/app/handle')
  public async handleApp(@Body() body: any) {
    try {
      await this.bitrixService.callMethod('im.message.add', {
        DIALOG_ID: 'chat84',
        MESSAGE: `Обработка приложения [b](Node)![/b][br][br]${JSON.stringify(body) ?? ''}`,
        SYSTEM: 'Y',
      });
      return {
        status: true,
      };
    } catch (err) {
      this.logger.error({
        handler: this.handleApp.name,
        error: maybeCatchError(err),
      });
      return {
        status: false,
      };
    }
  }
}
