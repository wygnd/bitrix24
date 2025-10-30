import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  B24ApiTags,
  B24BatchResponseMap,
} from '../../../interfaces/bitrix-api.interface';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AvitoFindDuplicateLeadsDto } from './dtos/avito.dto';
import { BitrixService } from '../../../bitrix.service';
import { B24BatchCommands } from '../../../interfaces/bitrix.interface';
import { B24DuplicateFindByComm } from '../../lead/lead.interface';
import { AvitoChatInfo } from './interfaces/avito.interface';
import { isArray, isObject } from 'class-validator';
import { BitrixMessageService } from '../../im/im.service';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { BitrixLeadService } from '@/modules/bitirx/modules/lead/lead.service';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';

@ApiTags(B24ApiTags.AVITO)
@UseGuards(AuthGuard)
@Controller('integration/avito')
export class BitrixAvitoController {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixMessageService: BitrixMessageService,
    private readonly bitrixIntegrationAvitoService: BitrixIntegrationAvitoService,
    private readonly bitrixLeadService: BitrixLeadService,
  ) {}

  @ApiOperation({
    summary: 'Find duplicate leads by phone',
  })
  @ApiBody({ type: AvitoFindDuplicateLeadsDto, isArray: true })
  @ApiExceptions()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
    type: [AvitoFindDuplicateLeadsDto],
  })
  @Post('/find-duplicate-leads')
  @HttpCode(HttpStatus.OK)
  async findDuplicateLeadsByPhone(@Body() body: AvitoFindDuplicateLeadsDto[]) {
    try {
      const batchCommands = body.reduce((acc, { phone, chat_id }) => {
        acc[`getDuplicateLeads_${phone}_${chat_id}`] = {
          method: 'crm.duplicate.findbycomm',
          params: {
            type: 'PHONE',
            values: [phone],
            entity_type: 'LEAD',
          },
        };

        return acc;
      }, {} as B24BatchCommands);

      const batchResponseFindDuplicates =
        await this.bitrixService.callBatch<
          B24BatchResponseMap<
            Record<string, [] | { LEAD: B24DuplicateFindByComm[] }>
          >
        >(batchCommands);

      const { result } = batchResponseFindDuplicates.result;

      return Object.entries(result).reduce((acc, [command, response]) => {
        if (isArray(response)) return acc;

        const [, phone, chatId] = command.split('_');

        acc.push({
          phone: phone,
          chat_id: chatId,
        });

        return acc;
      }, [] as AvitoChatInfo[]);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({
    summary: 'Send message in bitrix chat about unread chat in avito',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success: Returned message id',
    example: 125678392,
  })
  @ApiExceptions()
  @ApiBody({ type: String, isArray: true })
  @Post('/notify-about-unread-chats')
  async notifyAboutUnreadChats(@Body() accountNames: string[]) {
    try {
      const notifyMessage = accountNames.reduce((acc, accountName) => {
        acc += accountName + '[br]';
        return acc;
      }, '[b]Непрочитанные сообщения с Авито:[/b][br]');

      const sendMessageResult =
        await this.bitrixMessageService.sendPrivateMessage({
          DIALOG_ID: 'chat17030', // Авито
          MESSAGE: notifyMessage,
        });

      return sendMessageResult.result ?? -1;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  // @ApiOperation({
  //   summary: 'Create lead from avito chats',
  // })
  // @ApiBody({ type: AvitoCreateLeadDto })
  // @Post('/create-lead')
  // async createLeadFromAvito(@Body() fields: AvitoCreateLeadDto) {
  //   try {
  //     const {
  //       users,
  //       phone,
  //       avito_number,
  //       avito,
  //       messages,
  //       client_name,
  //       region,
  //       city,
  //       service_text,
  //       date,
  //       time,
  //     } = fields;
  //     const minWorkflowUser =
  //       await this.bitrixIntegrationAvitoService.getMinWorkflowUser(users);
  //
  //     const { result } =
  //       await this.bitrixLeadService.getDuplicateLeadsByPhone(phone);
  //
  //     if (isArray(result) && result.length === 0) {
  //       //   todo: create lead
  //       const batchCommands: B24BatchCommands = {
  //         create_lead: {
  //           method: 'crm.lead.add',
  //           params: {
  //             fields: {
  //               ASSIGNED_BY_ID:
  //                 this.bitrixService.isAvailableToDistributeOnManager()
  //                   ? minWorkflowUser
  //                   : '344',
  //               UF_CRM_1669804346: avito,
  //               UF_CRM_1653291114976: messages.join('[br][br]'),
  //               PHONE: [
  //                 {
  //                   VALUE: phone,
  //                 },
  //               ],
  //               UF_CRM_1651577716: 6856,
  //               // Файлы
  //               UF_CRM_1692711658572: '',
  //               // Новый в работе
  //               STATUS_ID: 'UC_GEWKFD',
  //               // fixme: ?? idk what is that field
  //               UF_CRM_1573459036: '',
  //               // С какого авито обращение
  //               UF_CRM_1712667568: avito,
  //               UF_CRM_1713765220416: avito_number,
  //               UF_CRM_1580204442317: city,
  //               UF_CRM_1760173920: region,
  //               NAME: client_name,
  //               UF_CRM_1598441630: '',
  //             },
  //           },
  //         },
  //       };
  //
  //       return;
  //     }
  //     //   todo: update lead
  //
  //     return {
  //       message: 'need update lead',
  //       result: result,
  //     };
  //   } catch (error) {
  //     console.log(error);
  //     throw new HttpException(error, HttpStatus.BAD_REQUEST);
  //   }
  // }
}
