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
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AvitoFindDuplicateLeadsDto } from './avito.dto';
import { BitrixService } from '../../../bitrix.service';
import { B24BatchCommands } from '../../../interfaces/bitrix.interface';
import { B24DuplicateFindByComm } from '../../lead/lead.interface';
import { BitrixLeadService } from '../../lead/lead.service';

@ApiTags(B24ApiTags.AVITO)
@Controller('integration/avito')
export class BitrixAvitoController {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixLeadService: BitrixLeadService,
  ) {}

  @ApiBody({ type: AvitoFindDuplicateLeadsDto, isArray: true })
  @Post('/find-duplicate-leads')
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
          B24BatchResponseMap<{ LEAD: B24DuplicateFindByComm[] }>
        >(batchCommands);

      const { result } = batchResponseFindDuplicates.result;

      return result;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
