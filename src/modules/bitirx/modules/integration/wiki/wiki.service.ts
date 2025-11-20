import { Injectable } from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { UnloadLostCallingResponse } from '@/modules/bitirx/modules/integration/wiki/interfaces/wiki-unload-lost-calling.interface';
import { UnloadLostCallingDto } from '@/modules/bitirx/modules/integration/wiki/dtos/wiki-unload-lost-calling.dto';
import { WikiService } from '@/modules/wiki/wiki.service';

@Injectable()
export class BitrixWikiService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly wikiService: WikiService,
  ) {}

  // todo: change receive object fields
  public async unloadLostCalling({ phones, needCreate = 0 }: any) {
    const uniquePhones = new Set(phones);
    const users = await this.wikiService.getWorkingSalesFromWiki();
    const batchCommandsBatches: B24BatchCommands[] = [];
    let batchIndex = 0;

    uniquePhones.forEach((phone) => {
      if (
        batchIndex in batchCommandsBatches &&
        Object.keys(batchCommandsBatches[batchIndex]).length === 50
      )
        batchIndex++;

      if (
        !(batchIndex in batchCommandsBatches) ||
        Object.keys(batchCommandsBatches[batchIndex]).length == 0
      )
        batchCommandsBatches[batchIndex] = {};

      batchCommandsBatches[batchIndex][`find_duplicates=${phone}`] = {
        method: 'crm.duplicate.findbycomm',
        params: {
          type: 'PHONE',
          values: [phone],
          entity_type: 'LEAD',
        },
      };
    });

    const batchResponse = await Promise.all(
      batchCommandsBatches.map((batchCommands) =>
        this.bitrixService
          .callBatch<B24BatchResponseMap>(batchCommands)
          .then((res) => res.result.result),
      ),
    );

    const phonesNeedCreateLead: Set<string> = new Set();
    const resultPhones: Set<UnloadLostCallingResponse> = new Set();

    batchResponse.forEach((batchResponseList) => {
      Object.entries(batchResponseList).forEach(([command, bResponse]) => {
        const phone = command.split('=')[1];

        if (Array.isArray(bResponse)) {
          phonesNeedCreateLead.add(phone);
          return;
        }

        resultPhones.add({
          leadId: bResponse.LEAD[0],
          phone: phone,
          status: 'exists',
        });
      });
    });

    if (phonesNeedCreateLead.size === 0) return [...resultPhones];

    if (needCreate === 1) {
      const batchCommandsCreateLeadsBatches: B24BatchCommands[] = [];
      batchIndex = 0;
      let userIndex = 0;

      phonesNeedCreateLead.forEach((phone) => {
        if (
          batchIndex in batchCommandsCreateLeadsBatches &&
          Object.keys(batchCommandsCreateLeadsBatches[batchIndex]).length === 50
        )
          batchIndex++;

        if (
          !(batchIndex in batchCommandsCreateLeadsBatches) ||
          Object.keys(batchCommandsCreateLeadsBatches[batchIndex]).length == 0
        )
          batchCommandsCreateLeadsBatches[batchIndex] = {};

        if (userIndex + 1 >= users.length) userIndex = 0;

        batchCommandsCreateLeadsBatches[batchIndex][`create_lead=${phone}`] = {
          method: 'crm.lead.add',
          params: {
            fields: {
              UF_CRM_1651577716: '7420',
              STATUS_ID: '3',
              PHONE: [
                {
                  VALUE: phone,
                  VALUE_TYPE: 'WORK',
                },
              ],
              ASSIGNED_BY_ID: users[userIndex],
            },
          },
        };
        batchCommandsCreateLeadsBatches[batchIndex][`add_comment=${phone}`] = {
          method: 'crm.timeline.comment.add',
          params: {
            fields: {
              ENTITY_ID: `$result[create_lead=${phone}]`,
              ENTITY_TYPE: 'lead',
              COMMENT:
                'Лид был создан [Дата] и не был добавлен из-за сбоя в системе. Учитывайте в работе',
              AUTHOR_ID: '460',
            },
          },
        };

        userIndex++;
      });

      const batchResponseCreateLead = await Promise.all(
        batchCommandsCreateLeadsBatches.map((batchCommands) =>
          this.bitrixService.callBatch<B24BatchResponseMap>(batchCommands),
        ),
      );

      batchResponseCreateLead.forEach((batchResponseCreateLeadList) => {
        Object.entries(batchResponseCreateLeadList.result.result).forEach(
          ([command, result]) => {
            const [commandName, phone] = command.split('=');

            if (commandName !== 'create_lead') return;

            resultPhones.add({
              leadId: result,
              phone: phone,
              status: 'new',
            });
          },
        );
      });
    } else {
      phonesNeedCreateLead.forEach((phone) => {
        resultPhones.add({
          leadId: '',
          phone: phone,
          status: 'not-created',
        });
      });
    }

    return [...resultPhones];
  }
}
