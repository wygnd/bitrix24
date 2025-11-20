import {
  Body,
  Controller, Get,
  HttpCode,
  HttpStatus,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { B24ApiTags } from '../../../interfaces/bitrix-api.interface';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvitoFindDuplicateLeadsDto } from './dtos/avito.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';
import { BitrixLeadService } from '@/modules/bitirx/modules/lead/lead.service';

@ApiTags(B24ApiTags.AVITO)
@UseGuards(AuthGuard)
@Controller('integration/avito')
export class BitrixAvitoController {
  constructor(
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
    return this.bitrixIntegrationAvitoService.findDuplicatesLeadsBPhones(body);
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
    return this.bitrixIntegrationAvitoService.notifyAboutUnreadChatsOnAvito(
      accountNames,
    );
  }

  @ApiOperation({
    summary: 'сообщений из авито',
  })
  @ApiBody({ type: AvitoCreateLeadDto })
  @Post('/receive-client-request')
  async createLeadFromAvito(@Body() fields: AvitoCreateLeadDto) {
    return this.bitrixIntegrationAvitoService.distributeClientRequests(fields);
  }
}
