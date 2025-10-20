import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  B24ApiTags,
  B24BatchResponseMap,
} from '../../../interfaces/bitrix-api.interface';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvitoFindDuplicateLeadsDto } from './avito.dto';
import { BitrixService } from '../../../bitrix.service';
import { B24BatchCommands } from '../../../interfaces/bitrix.interface';
import { B24DuplicateFindByComm } from '../../lead/lead.interface';
import { AvitoChatInfo } from './avito.interface';
import { isArray } from 'class-validator';
import { BitrixMessageService } from '../../im/im.service';
import { ApiExceptions } from '../../../../../common/decorators/api-exceptions.decorator';

@ApiTags(B24ApiTags.AVITO)
@Controller('integration/avito')
export class BitrixAvitoController {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixMessageService: BitrixMessageService,
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
        console.log(phone);
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

      const chats = Object.entries(result)
        .map(([key, response]) => {
          const [, phone, chatId] = key.split('_');

          console.log('Check', response);

          if (!isArray(response)) return null;

          return {
            phone: phone,
            chat_id: +chatId,
          };
        })
        .filter((item) => item) as AvitoChatInfo[];

      console.log(chats);

      return chats;
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
  async sendMessage(@Body() accountNames: string[]) {
    try {
      const notifyMessage = accountNames.reduce((acc, accountName) => {
        acc += accountName + '[br]';
        return acc;
      }, '[b]Непрочитанные сообщения с Авито:[/b][br]');

      const sendMessageResult =
        await this.bitrixMessageService.sendPrivateMessage({
          DIALOG_ID: 'chat77152',
          MESSAGE: notifyMessage,
        });

      return sendMessageResult.result ?? -1;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
