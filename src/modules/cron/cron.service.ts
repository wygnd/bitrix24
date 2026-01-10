import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BitrixMessagesUseCase } from '@/modules/bitrix/application/use-cases/messages/messages.use-case';

@Injectable()
export class CronService {
  constructor(private readonly bitrixMessages: BitrixMessagesUseCase) {}

  /**
   * Add task on notify ksenya about uploading calling from megafon.
   * Task running every work day at 9:10 am
   */
  @Cron('0 10 9 * * 1-5', {
    timeZone: 'Europe/Moscow',
  })
  async handleCronNotifyAboutNeedLoadCallingFromMegafon(): Promise<void> {
    this.bitrixMessages.sendPrivateMessage({
      DIALOG_ID: '464',
      MESSAGE:
        'Доброе утро Ксюша![br]Выгрузи пожалуйста файл за последние 5 дней из АТС Мегафона по всем входящим и исходящим звонкам',
    });
  }
}
