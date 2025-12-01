import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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

@ApiTags(B24ApiTags.AVITO)
@UseGuards(AuthGuard)
@Controller('integration/avito')
export class BitrixAvitoController {
  constructor(
    private readonly bitrixIntegrationAvitoService: BitrixIntegrationAvitoService,
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
    summary: 'Выгрузка сообщения из авито',
  })
  @ApiBody({ type: AvitoCreateLeadDto })
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/receive-client-request')
  async createLeadFromAvito(@Body() fields: AvitoCreateLeadDto) {
    return this.bitrixIntegrationAvitoService.handleDistributeClientRequestFromAvito(
      fields,
    );
  }
}
