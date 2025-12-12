import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  B24EventAdd,
  B24EventBody,
  B24EventTaskUpdateData,
} from '@/modules/bitrix/modules/events/interfaces/events.interface';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { BitrixTaskService } from '@/modules/bitrix/modules/task/task.service';
import { EventLeadDeleteDto } from '@/modules/bitrix/modules/events/dtos/event-lead-delete.dto';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import { QueueMiddleService } from '@/modules/queue/queue-middle.service';
import { B24EventRemoveDto } from '@/modules/bitrix/modules/events/dtos/event-remove.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { B24EventVoxImplantCallEndDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-end.dto';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { TelphinCallItem } from '@/modules/telphin/interfaces/telphin-call.interface';
import { TelphinExtensionItem } from '@/modules/telphin/interfaces/telphin-extension.interface';
import { BitrixLeadService } from '@/modules/bitrix/modules/lead/services/lead.service';
import {
  B24LeadActiveStages,
  B24LeadConvertedStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/modules/lead/constants/lead.constants';

@Injectable()
export class BitrixEventService {
  private readonly logger = new WinstonLogger(BitrixEventService.name);

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly taskService: BitrixTaskService,
    private readonly queueLightService: QueueLightService,
    private readonly queueMiddleService: QueueMiddleService,
    private readonly telphinService: TelphinService,
    private readonly bitrixLeadService: BitrixLeadService,
  ) {}

  async addEvent(fields: B24EventAdd) {
    return (
      (
        await this.bitrixService.callMethod<B24EventAdd, boolean>(
          'event.bind',
          fields,
        )
      ).result ?? false
    );
  }

  async handleTaskUpdate(fields: B24EventBody<B24EventTaskUpdateData>) {
    const { ID: taskId } = fields.data.FIELDS_BEFORE;
    const task = await this.taskService.getTaskById(taskId, undefined, true);

    if (task.title.startsWith('[МАКЕТ]')) {
      this.queueMiddleService.addTaskToHandleSmmTaskSmmAdvertLayouts(task);
      return true;
    }

    return false;
  }

  async handleLeadDelete(fields: EventLeadDeleteDto) {
    const { data } = fields;

    this.queueLightService
      .addTaskSendWikiRequestOnDeleteLead(data.FIELDS.ID)
      .then((res) => {
        this.logger.info(
          `Added in queue: ${JSON.stringify(fields)} => ${res.toJSON()}`,
        );
      });
    return true;
  }

  async getEventList() {
    return this.bitrixService.callMethod('event.get');
  }

  async removeEvent(fields: B24EventRemoveDto) {
    return this.bitrixService.callMethod('event.unbind', fields);
  }

  public async handleVoxImplantCallEnd({ data }: B24EventVoxImplantCallEndDto) {
    this.bitrixService.callMethod('imbot.message.add', {
      BOT_ID: this.bitrixService.BOT_ID,
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE: '[b]Завершение звонка[/b][br]' + JSON.stringify(data),
    });
    try {
      const { PHONE_NUMBER: phone, PORTAL_USER_ID: userId } = data;
      let leadId = '';

      // получаем информацию о клиенте telphin и пользователя с битрикс, кому позвонили
      const telphinUserInfo = await this.telphinService.getUserInfo();

      // если не получили информацию: пробрасываем ошибку
      if (!telphinUserInfo)
        throw new InternalServerErrorException('Invalid get info from telphin');

      const { client_id: telphinClientId } = telphinUserInfo;

      // Получаем текущие звонки и внутренний номер менеджера, кому звонят
      const [targetCalls, extension] = await Promise.all<
        [Promise<TelphinCallItem[]>, Promise<TelphinExtensionItem | null>]
      >([
        this.telphinService.getCurrentCalls(telphinClientId),
        this.telphinService.getClientExtensionByBitrixUserId(
          telphinClientId,
          userId,
        ),
      ]);

      if (!extension)
        throw new BadRequestException('Extension by user bitrix id not found');

      // Ищем внутренний номер в текущем списке звонков(кто на данный момент в звонке)
      const targetExtension = targetCalls.find(
        ({ call_flow, caller_extension: { id: extId } }) =>
          extId === extension.id && call_flow === 'IN',
      );

      // Если не находим перца: выходим
      if (!targetExtension)
        throw new BadRequestException(
          'Extension in current calls was not found',
        );

      // Если не передан leadId, пытаемся найти лид по номеру телефона
      // Ищем дубликаты
      const duplicateLeads =
        await this.bitrixLeadService.getDuplicateLeadsByPhone(phone);

      // Если нет дубликатов: создаем лид
      if (duplicateLeads.length === 0) {
        const { result } = await this.bitrixLeadService.createLead({
          ASSIGNED_BY_ID: this.bitrixService.ZLATA_ZIMINA_BITRIX_ID,
          STATUS_ID: B24LeadActiveStages[0], // Новый в работе
          PHONE: [
            {
              VALUE: phone,
              VALUE_TYPE: 'WORK',
            },
          ],
        });

        if (!result) throw new BadRequestException('Ошибка при создании лида');

        leadId = result.toString();
      }

      const lead = await this.bitrixLeadService.getLeadById(leadId);

      if (!lead || !lead.result)
        throw new BadRequestException('Lead not found.');

      const { STATUS_ID: statusId } = lead.result;

      switch (true) {
        // Если лид в активных стадиях
        case B24LeadActiveStages.includes(statusId):
        case B24LeadConvertedStages.includes(statusId):
          break;

        // Если лид в неактивных стадиях
        case B24LeadRejectStages.includes(statusId):
          this.bitrixLeadService
            .updateLead({
              id: leadId,
              fields: {
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
                ASSIGNED_BY_ID: userId,
              },
            })
            .then((res) => {
              this.logger.info(`Result update lead: ${JSON.stringify(res)}`);
            })
            .catch((err) => {
              this.logger.error(
                `Execute error on update lead in rejected stages: ${JSON.stringify(err)}`,
              );
            });
          break;
      }

      return true;
    } catch (e) {
      this.logger.error(e, e?.stack, true);
      return false;
    }
  }
}
