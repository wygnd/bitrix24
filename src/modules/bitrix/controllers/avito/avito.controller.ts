import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { B24ApiTags } from '../../interfaces/bitrix-api.interface';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvitoFindDuplicateLeadsDto } from '../../application/dtos/avito/avito.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AvitoCreateLeadDto } from '@/modules/bitrix/application/dtos/avito/avito-create-lead.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { BitrixAvitoUseCase } from '@/modules/bitrix/application/use-cases/avito/avito.use-case';

@ApiTags(B24ApiTags.AVITO)
@ApiExceptions()
@UseGuards(AuthGuard)
@Controller('integration/avito')
export class BitrixAvitoController {
  constructor(
    private readonly bitrixAvito: BitrixAvitoUseCase,
  ) {}

  @ApiOperation({
    summary: 'Find duplicate leads by phone',
  })
  @ApiBody({ type: AvitoFindDuplicateLeadsDto, isArray: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
    type: [AvitoFindDuplicateLeadsDto],
  })
  @Post('/find-duplicate-leads')
  @HttpCode(HttpStatus.OK)
  async findDuplicateLeadsByPhone(@Body() body: AvitoFindDuplicateLeadsDto[]) {
    return this.bitrixAvito.findDuplicatesLeadsBPhones(body);
  }

  @ApiOperation({
    summary: 'Send message in bitrix chat about unread chat in avito',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success: Returned message id',
    example: 125678392,
  })
  @ApiBody({ type: String, isArray: true })
  @Post('/notify-about-unread-chats')
  async notifyAboutUnreadChats(@Body() accountNames: string[]) {
    return this.bitrixAvito.notifyAboutUnreadChatsOnAvito(
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
    return this.bitrixAvito.handleDistributeClientRequestFromAvito(
      fields,
    );
  }
}
