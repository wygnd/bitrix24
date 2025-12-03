import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BitrixService } from '@/modules/bitirx/bitrix.service';

@Injectable()
export class CronService {
  constructor(private readonly bitrixService: BitrixService) {}

  /**
   * Add task on notify ksenya about uploading calling from megafon.
   * Task running every work day at 9:10 am
   */
  @Cron('* 10 9 * * 1-5')
  async handleCronNotifyAboutNeedLoadCallingFromMegafon() {
    this.bitrixService.callBatch({
      send_message: {
        method: 'im.message.add',
        params: {
          DIALOG_ID: '464',
          MESSAGE:
            'Доброе утро Ксюша![br]Выгрузи пожалуйста файл за последние 5 дней из АТС Мегафона по всем входящим и исходящим звонкам',
        },
      },
      notify_about_message: {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixService.BOT_ID,
          DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
          MESSAGE: '[USER=376][/USER][br]Отправлено сообщение по крону',
        },
      },
    });
  }
}
